import { randomBytes } from "crypto";
import { Router } from "express";
import { dal } from "../dal";
import {
  attachUser,
  authRequired,
  ensureCsrfToken,
  generateCsrfToken,
  hashPassword,
  hashSessionToken,
  LoginSchema,
  RegisterSchema,
  requireCsrfProtection,
  setCsrfCookie,
  setSessionCookie,
  persistSession,
  verifyPassword,
} from "../auth";
import type { Request, Response } from "express";
import type { AuthUser } from "../dal";
import { getGitHubConfig } from "../github/config";
import { createGitHubState, consumeGitHubState, storeGitHubToken } from "../github/state";
import { exchangeCodeForToken, fetchGitHubUser, fetchPrimaryEmail } from "../github/client";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const AUTH_RATE_LIMIT_WINDOW_MS = 60_000;
const AUTH_RATE_LIMIT_MAX_ATTEMPTS = (() => {
  const parsed = Number(process.env.OPENDOCK_AUTH_RATE_LIMIT ?? 20);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }
  return parsed;
})();

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

const router = Router();

router.use(attachUser);

router.get("/csrf", (req, res) => {
  const token = ensureCsrfToken(req, res);
  res.json({ csrfToken: token });
});

router.get("/session", (req, res) => {
  const token = ensureCsrfToken(req, res);
  const user = (req as RequestWithOptionalUser).user
    ? toPublicUser((req as RequestWithOptionalUser).user!)
    : null;
  res.json({ user, csrfToken: token });
});

router.get("/github/login", (req, res) => {
  const config = getGitHubConfig();
  if (!config) {
    res.status(503).json({
      error: {
        code: "GITHUB_AUTH_DISABLED",
        message: "GitHub authentication is not configured. Set OPENDOCK_GITHUB_CLIENT_ID and OPENDOCK_GITHUB_CLIENT_SECRET.",
      },
    });
    return;
  }

  const redirectQuery = typeof req.query.redirect === "string" ? req.query.redirect : null;
  const state = createGitHubState(redirectQuery);

  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("scope", config.scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "true");

  res.redirect(authorizeUrl.toString());
});

router.get("/github/callback", async (req, res) => {
  const config = getGitHubConfig();
  if (!config) {
    res.status(503).json({
      error: {
        code: "GITHUB_AUTH_DISABLED",
        message: "GitHub authentication is not configured.",
      },
    });
    return;
  }

  const stateParam = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!stateParam || !code) {
    res.status(400).json({
      error: {
        code: "INVALID_CALLBACK",
        message: "Missing state or code parameter from GitHub callback.",
      },
    });
    return;
  }

  const stateRecord = consumeGitHubState(stateParam);
  if (!stateRecord) {
    res.status(400).json({
      error: {
        code: "STATE_MISMATCH",
        message: "GitHub OAuth state is invalid or has expired.",
      },
    });
    return;
  }

  try {
    const tokenResponse = await exchangeCodeForToken({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      code,
      redirectUri: config.redirectUri,
    });

    const githubUser = await fetchGitHubUser(tokenResponse.access_token);
    const primaryEmail =
      (await fetchPrimaryEmail(tokenResponse.access_token)) ?? (githubUser as { email?: string }).email ?? null;

    if (!primaryEmail) {
      res.status(400).json({
        error: {
          code: "EMAIL_REQUIRED",
          message: "GitHub account has no accessible email address. Please make the email public or grant email scope.",
        },
      });
      return;
    }

    if (dal.kind !== "sql") {
      res.status(503).json({
        error: {
          code: "AUTH_UNAVAILABLE",
          message: "Authentication is only available when the SQL data provider is enabled.",
        },
      });
      return;
    }

    let user = await dal.auth.findUserByEmail(primaryEmail);

    if (!user) {
      const passwordSeed = randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(passwordSeed);
      user = await dal.auth.createUser({
        email: primaryEmail,
        passwordHash,
        displayName: githubUser.name ?? githubUser.login ?? primaryEmail.split("@")[0] ?? "GitHub User",
        role: "member",
      });
    }

    storeGitHubToken(user.id, {
      accessToken: tokenResponse.access_token,
      tokenType: tokenResponse.token_type,
      scope: tokenResponse.scope,
      updatedAt: Date.now(),
    });

    await establishSession(req, res, user.id);
    const redirectUrl = resolvePostAuthRedirect(stateRecord.redirectTo);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("[auth] GitHub OAuth failed", error);
    res.status(500).json({
      error: {
        code: "GITHUB_OAUTH_FAILED",
        message: error instanceof Error ? error.message : "GitHub authentication failed.",
      },
    });
  }
});

router.post("/register", requireCsrfProtection, async (req, res) => {
  const body = normalizeBody(req.body);
  if (dal.kind !== "sql") {
    res.status(503).json({
      error: {
        code: "AUTH_UNAVAILABLE",
        message: "Authentication is only available when the SQL data provider is enabled.",
      },
    });
    return;
  }

  const parsed = RegisterSchema.safeParse({
    email: body.email,
    password: body.password,
    displayName: body.displayName,
  });
  if (!parsed.success) {
    res.status(400).json({ error: { code: "INVALID_PAYLOAD", issues: parsed.error.flatten() } });
    return;
  }
  const { email, password, displayName } = parsed.data;

  if (!consumeAuthRateLimit(req, email)) {
    respondRateLimited(res);
    return;
  }

  const existing = await dal.auth.findUserByEmail(email);
  if (existing) {
    res.status(409).json({ error: { code: "EMAIL_TAKEN", message: "Email already registered." } });
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await dal.auth.createUser({
    email,
    passwordHash,
    displayName: displayName ?? deriveDisplayName(email),
    role: "member",
  });

  const csrfToken = await establishSession(req, res, user.id);

  res.status(201).json({
    user: toPublicUser(user),
    csrfToken,
  });
});

router.post("/login", requireCsrfProtection, async (req, res) => {
  const body = normalizeBody(req.body);
  if (dal.kind !== "sql") {
    res.status(503).json({
      error: {
        code: "AUTH_UNAVAILABLE",
        message: "Authentication is only available when the SQL data provider is enabled.",
      },
    });
    return;
  }

  const parsed = LoginSchema.safeParse({
    email: body.email,
    password: body.password,
  });
  if (!parsed.success) {
    res.status(400).json({ error: { code: "INVALID_PAYLOAD", issues: parsed.error.flatten() } });
    return;
  }
  const { email, password } = parsed.data;

  if (!consumeAuthRateLimit(req, email)) {
    respondRateLimited(res);
    return;
  }

  const record = await dal.auth.findUserByEmailWithPassword(email);
  if (!record) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    return;
  }

  const passwordValid = await verifyPassword(password, record.passwordHash);
  if (!passwordValid) {
    res.status(401).json({ error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } });
    return;
  }

  const csrfToken = await establishSession(req, res, record.id);

  res.json({
    user: toPublicUser(record),
    csrfToken,
  });
});

router.post("/logout", authRequired, requireCsrfProtection, async (req, res) => {
  const token = req.cookies?.["od.sid"];
  if (token && dal.kind === "sql") {
    await dal.auth.revokeSession(hashSessionToken(token));
  }
  res.clearCookie("od.sid", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("od.csrf", {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(204).send();
});

function deriveDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? "user";
  return localPart.replace(/[._-]/g, " ").replace(/\s+/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

async function establishSession(req: Request, res: Response, userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
  const { token } = await persistSession({
    userId,
    userAgent: req.get("user-agent") ?? "unknown",
    ipAddress: getClientIp(req),
    expiresAt,
  });
  setSessionCookie(res, token, expiresAt);
  const csrfToken = generateCsrfToken();
  setCsrfCookie(res, csrfToken);
  return csrfToken;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0]!.trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0]!.trim();
  }
  return req.ip ?? "unknown";
}

interface RequestWithOptionalUser extends Request {
  user?: AuthUser;
}

function toPublicUser(user: AuthUser | { id: string; email: string; displayName: string | null; role: string; createdAt: Date; updatedAt: Date }): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function normalizeBody(body: unknown): Record<string, unknown> {
  if (typeof body === "string" && body.length > 0) {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }
  if (body && typeof body === "object") {
    return body as Record<string, unknown>;
  }
  return {};
}

function makeRateLimitKey(req: Request, email: string | null): string {
  const ip = getClientIp(req);
  const normalizedEmail = email ? email.trim().toLowerCase() : "";
  return `${ip}:${normalizedEmail}`;
}

function consumeAuthRateLimit(req: Request, email: string): boolean {
  const key = makeRateLimitKey(req, email);
  const now = Date.now();
  const existing = rateLimitBuckets.get(key);
  if (!existing || existing.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (existing.count >= AUTH_RATE_LIMIT_MAX_ATTEMPTS) {
    return false;
  }
  existing.count += 1;
  return true;
}

function respondRateLimited(res: Response): void {
  res.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: "Too many attempts. Please try again later.",
    },
  });
}

export function __resetAuthRateLimiter(): void {
  rateLimitBuckets.clear();
}

export { router as authRouter };

function resolvePostAuthRedirect(redirectTo: string | null): string {
  const allowedOrigins = getAllowedWebOrigins();
  const fallbackOrigin = allowedOrigins[0] ?? "http://localhost:5173";
  const fallbackUrl = new URL("/dashboard", fallbackOrigin).toString();

  if (redirectTo) {
    try {
      const candidate = new URL(redirectTo, fallbackOrigin);
      if (allowedOrigins.includes(candidate.origin)) {
        return candidate.toString();
      }
    } catch (_err) {
      // ignore invalid redirect target
    }
  }

  return fallbackUrl;
}

function getAllowedWebOrigins(): string[] {
  const configured = process.env.OPENDOCK_WEB_ORIGIN
    ? process.env.OPENDOCK_WEB_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean)
    : [];

  const origins = configured
    .map(normalizeOrigin)
    .filter((value): value is string => Boolean(value));

  if (origins.length > 0) {
    return origins;
  }

  return [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
  ];
}

function normalizeOrigin(candidate: string): string | null {
  try {
    const url = new URL(candidate);
    return url.origin;
  } catch (_err) {
    return null;
  }
}
