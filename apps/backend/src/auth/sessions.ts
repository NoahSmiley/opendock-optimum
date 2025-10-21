import crypto from "crypto";
import type { Response } from "express";
import { dal } from "../dal";

export const SESSION_COOKIE_NAME = "od.sid";
export const CSRF_COOKIE_NAME = "od.csrf";

export interface SessionPayload {
  userId: string;
  userAgent: string;
  ipAddress: string;
  expiresAt: Date;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export async function persistSession(payload: SessionPayload): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  await dal.auth.createSession({
    userId: payload.userId,
    tokenHash,
    userAgent: payload.userAgent,
    ipAddress: payload.ipAddress,
    expiresAt: payload.expiresAt,
  });
  return { token, expiresAt: payload.expiresAt };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
  });
}

