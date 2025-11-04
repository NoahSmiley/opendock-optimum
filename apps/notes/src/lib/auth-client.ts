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

export async function ensureCsrf(): Promise<void> {
  if (!csrfToken) {
    await fetchCsrfToken();
  }
}

export async function resolveCsrfHeaders(): Promise<Record<string, string>> {
  await ensureCsrf();
  return csrfToken ? { [CSRF_HEADER]: csrfToken } : {};
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName?: string;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
  await ensureCsrf();
  const headers = await resolveCsrfHeaders();
  return request<AuthUser>({
    path: "/api/auth/register",
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  await ensureCsrf();
  const headers = await resolveCsrfHeaders();
  return request<AuthUser>({
    path: "/api/auth/login",
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
  });
}

export async function logout(): Promise<void> {
  const headers = await resolveCsrfHeaders();
  await request<void>({
    path: "/api/auth/logout",
    method: "POST",
    headers,
  });
  csrfToken = null;
}
