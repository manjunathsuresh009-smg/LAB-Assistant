const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "/api";
const TOKEN_KEY = "campuslab_token";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status = 0, code = "UNKNOWN", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  authenticated?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, authenticated = true } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (authenticated && token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Could not reach the CampusLab API. Check your connection and try again.",
      0,
      "NETWORK"
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { success?: boolean; data?: T; error?: { message?: string; code?: string; details?: unknown } }
    | null;

  if (!response.ok) {
    const isAuthAttempt = path.includes("/auth/login") || path.includes("/auth/register");
    if (response.status === 401 && !isAuthAttempt) {
      window.dispatchEvent(new CustomEvent("campuslab:unauthorized"));
    }
    throw new ApiError(
      payload?.error?.message ?? "Request failed. Please try again.",
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.details
    );
  }

  if (!payload || payload.data === undefined) {
    throw new ApiError("Unexpected response from the server", 500, "BAD_RESPONSE");
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, authenticated = true) =>
    request<T>(path, { method: "POST", body, authenticated }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
};
