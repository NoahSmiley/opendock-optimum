import { request } from "@opendock/shared/api";

const CSRF_HEADER = "X-OPENDOCK-CSRF";

let csrfToken: string | null = null;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  user: AuthUser | null;
  csrfToken: string;
}

export async function fetchSession(): Promise<SessionResponse> {
  const result = await request<SessionResponse>({
    path: "/api/auth/session",
    method: "GET",
  });
  if (result?.csrfToken) {
    csrfToken = result.csrfToken;
  }
  return result;
}

export async function fetchCsrfToken(): Promise<string> {
  const result = await request<{ csrfToken: string }>({
    path: "/api/auth/csrf",
    method: "GET",
  });
  if (result?.csrfToken) {
    csrfToken = result.csrfToken;
  }
  return csrfToken ?? "";
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await ensureCsrf();
  const result = await request<{ user: AuthUser; csrfToken: string }>({
    path: "/api/auth/register",
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      [CSRF_HEADER]: csrfToken!,
    },
  });
  if (result?.csrfToken) {
    csrfToken = result.csrfToken;
  }
  return result.user;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  await ensureCsrf();
  const result = await request<{ user: AuthUser; csrfToken: string }>({
    path: "/api/auth/login",
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      [CSRF_HEADER]: csrfToken!,
    },
  });
  if (result?.csrfToken) {
    csrfToken = result.csrfToken;
  }
  return result.user;
}

export async function logout(): Promise<void> {
  await ensureCsrf();
  await request<void>({
    path: "/api/auth/logout",
    method: "POST",
    headers: {
      [CSRF_HEADER]: csrfToken!,
    },
  });
  csrfToken = null;
}

async function ensureCsrf(): Promise<void> {
  if (csrfToken) return;
  await fetchCsrfToken();
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export async function resolveCsrfHeaders(): Promise<Record<string, string>> {
  let token = getCsrfToken();
  if (!token) {
    token = await fetchCsrfToken();
  }
  if (!token) {
    throw new Error("CSRF token is unavailable. Please refresh and try again.");
  }
  return {
    [CSRF_HEADER]: token,
  };
}
