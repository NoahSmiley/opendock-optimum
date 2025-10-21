type RequestOptions = RequestInit & { path: string };

async function request<T>({ path, ...options }: RequestOptions): Promise<T> {
  const baseUrl = getBaseUrl();
  console.log("[api] request path:", path);
  console.log("[api] request options:", options);
  console.log("[api] request body:", options.body);
  console.log("[api] request body type:", typeof options.body);
  
  const fetchOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  };
  
  console.log("[api] final fetch options:", fetchOptions);
  const response = await fetch(`${baseUrl}${path}`, fetchOptions);
  console.log("[api] response status:", response.status);

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  return JSON.parse(responseText) as T;
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
