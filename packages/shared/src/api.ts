type RequestOptions = RequestInit & { path: string };

export class RequestError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(init: { message: string; status: number; code?: string; details?: unknown }) {
    super(init.message || `Request failed (${init.status})`);
    this.name = "RequestError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
  }

  static async fromResponse(response: Response): Promise<RequestError> {
    let rawBody = "";
    try {
      rawBody = await response.text();
    } catch (_err) {
      rawBody = "";
    }

    let details: unknown = undefined;
    let message = rawBody.trim();
    let code: string | undefined;

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as
          | { error?: { message?: string; code?: string; [key: string]: unknown }; message?: string }
          | undefined;
        if (parsed && typeof parsed === "object") {
          details = parsed;
          if (parsed.error && typeof parsed.error === "object") {
            const errorPayload = parsed.error;
            if (typeof errorPayload.message === "string" && errorPayload.message.trim().length > 0) {
              message = errorPayload.message.trim();
            }
            if (typeof errorPayload.code === "string") {
              code = errorPayload.code;
            }
          } else if (typeof parsed.message === "string" && parsed.message.trim().length > 0) {
            message = parsed.message.trim();
          }
        }
      } catch (_err) {
        // Swallow JSON parse errors; fall back to raw body text.
      }
    }

    if (!message) {
      message = `Request failed (${response.status})`;
    }

    if (details === undefined && rawBody) {
      details = rawBody;
    }

    return new RequestError({
      message,
      status: response.status,
      code,
      details,
    });
  }
}

async function request<T>({ path, ...options }: RequestOptions): Promise<T> {
  const baseUrl = getBaseUrl();
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  const response = await fetch(`${baseUrl}${path}`, fetchOptions);

  if (!response.ok) {
    throw await RequestError.fromResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const shouldParseJson =
    contentType.includes("application/json") ||
    contentType.includes("+json") ||
    responseText.trim().startsWith("{") ||
    responseText.trim().startsWith("[");

  if (shouldParseJson) {
    try {
      return JSON.parse(responseText) as T;
    } catch (err) {
      throw new RequestError({
        message: "Failed to parse JSON response.",
        status: response.status,
        details: responseText,
      });
    }
  }

  return responseText as unknown as T;
}

export { request };

function getBaseUrl() {
  if (typeof window !== "undefined") {
    const win = window as typeof window & { __OPENDOCK_API_URL?: string };
    if (win.__OPENDOCK_API_URL) {
      return win.__OPENDOCK_API_URL;
    }
  }
  const meta = typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string> }) : undefined;
  const processEnvUrl = (() => {
    if (typeof globalThis === "undefined") return undefined;
    const maybeProcess = (globalThis as typeof globalThis & { process?: { env?: Record<string, string> } }).process;
    const value = maybeProcess?.env?.OPENDOCK_API_URL;
    return typeof value === "string" ? value : undefined;
  })();
  return meta?.env?.VITE_API_URL ?? processEnvUrl ?? "http://localhost:4000";
}

export function getApiBaseUrl(): string {
  return getBaseUrl();
}
