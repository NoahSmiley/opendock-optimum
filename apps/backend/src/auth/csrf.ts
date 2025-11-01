import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import { CSRF_COOKIE_NAME } from "./sessions";

export const CSRF_HEADER_NAME = "x-opendock-csrf";

export function generateCsrfToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export function ensureCsrfToken(req: Request, res: Response): string {
  const existing = req.cookies?.[CSRF_COOKIE_NAME];
  if (typeof existing === "string" && existing.length > 0) {
    return existing;
  }
  const token = generateCsrfToken();
  setCsrfCookie(res, token);
  return token;
}

export function verifyCsrfToken(req: Request): boolean {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length !== headerToken.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken));
  } catch {
    return false;
  }
}

export function requireCsrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (verifyCsrfToken(req)) {
    next();
    return;
  }
  console.warn(`[CSRF] Token validation failed for ${req.method} ${req.path}`);
  console.warn(`[CSRF] Cookie token present: ${!!req.cookies?.[CSRF_COOKIE_NAME]}`);
  console.warn(`[CSRF] Header token present: ${!!req.get(CSRF_HEADER_NAME)}`);
  res.status(403).json({ error: { code: "CSRF_VALIDATION_FAILED", message: "Invalid CSRF token." } });
}

