import { request, setCsrfToken } from "./base";
import type { AuthResponse, SessionResponse } from "@/types/user";

export async function fetchSession(): Promise<SessionResponse> {
  const res = await request<SessionResponse & { csrfToken?: string }>("/api/auth/session");
  if (res.csrfToken) setCsrfToken(res.csrfToken);
  return res;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await request<AuthResponse & { csrfToken?: string }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  if (res.csrfToken) setCsrfToken(res.csrfToken);
  return res;
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<AuthResponse> {
  const res = await request<AuthResponse & { csrfToken?: string }>("/api/auth/register", {
    method: "POST",
    body: { email, password, displayName },
  });
  if (res.csrfToken) setCsrfToken(res.csrfToken);
  return res;
}

export async function logout(): Promise<void> {
  return request<void>("/api/auth/logout", { method: "POST" });
}
