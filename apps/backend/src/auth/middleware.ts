import type { NextFunction, Request, Response } from "express";
import { dal } from "../dal";
import { hashSessionToken, SESSION_COOKIE_NAME } from "./sessions";
import type { AuthUser } from "../dal";

export interface RequestWithUser extends Request {
  user?: AuthUser;
}

export async function attachUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = (req.cookies?.[SESSION_COOKIE_NAME] ?? req.get("x-opendock-session"))?.trim();
    if (!token) {
      next();
      return;
    }
    const tokenHash = hashSessionToken(token);
    const session = await dal.auth.findSessionByTokenHash(tokenHash);
    if (!session || session.expiresAt.getTime() < Date.now()) {
      next();
      return;
    }
    (req as RequestWithUser).user = session.user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const user = (req as RequestWithUser).user;
  if (!user) {
    res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "You must be signed in." } });
    return;
  }
  next();
}

