const CSRF_HEADER = "x-opendock-csrf";
const CSRF_COOKIE = "od.csrf";

let csrfTokenCache: string | null = null;

function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "";
}

function getCsrfToken(): string | null {
  // Try cookie first
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CSRF_COOKIE}=`));
  const cookieToken = match ? match.split("=")[1] ?? null : null;
  if (cookieToken) {
    csrfTokenCache = cookieToken;
    return cookieToken;
  }
  // Fallback to cached token from session response
  return csrfTokenCache;
}

/** Store the CSRF token (called after session fetch) */
export function setCsrfToken(token: string): void {
  csrfTokenCache = token;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;
  const baseUrl = getBaseUrl();

  const csrf = getCsrfToken();
  if (csrf && method !== "GET") {
    headers[CSRF_HEADER] = csrf;
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, fetchOptions);

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    throw new ApiError(response.status, errorData.message, errorData.code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

async function parseErrorResponse(
  response: Response,
): Promise<{ message: string; code?: string }> {
  try {
    const data = await response.json();
    const err = data?.error ?? data;
    return {
      message: err?.message ?? `Request failed (${response.status})`,
      code: err?.code,
    };
  } catch {
    return { message: `Request failed (${response.status})` };
  }
}
