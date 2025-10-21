import { request } from "@opendock/shared/api";

const CSRF_HEADER = "X-OPENDOCK-CSRF";

let csrfToken: string | null = null;

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
