import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./auth";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

export const apiClient = axios.create({ baseURL: BASE, timeout: 30_000 });
const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

apiClient.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && cfg.headers) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

apiClient.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && orig && !orig._retry) {
      orig._retry = true;
      const refresh = getRefreshToken();
      if (!refresh) { clearTokens(); if (typeof window !== "undefined") window.location.href = "/login"; return Promise.reject(error); }
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh/`, { refresh });
        setTokens(data.access, refresh);
        if (orig.headers) orig.headers.Authorization = `Bearer ${data.access}`;
        return apiClient(orig);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ERR_NETWORK" || !err.response) {
      return "无法连接服务器，请确认后端已启动（python manage.py runserver）";
    }
    const d = err.response?.data as Record<string, unknown> | undefined;
    if (d?.detail) return String(d.detail);
    if (d?.non_field_errors) return String(d.non_field_errors);
    if (d) {
      const fieldError = Object.entries(d).find(
        ([, value]) => typeof value === "string" || Array.isArray(value)
      );
      if (fieldError) {
        const [field, value] = fieldError;
        const message = Array.isArray(value) ? value.join(" ") : String(value);
        return `${field}: ${message}`;
      }
    }
  }
  return err instanceof Error ? err.message : "Request failed";
}

/** Retry idempotent PATCH saves on transient network / busy-server failures. */
export async function patchWithRetry<T>(
  url: string,
  payload: unknown,
  attempts = 3
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const { data } = await apiClient.patch<T>(url, payload);
      return data;
    } catch (error) {
      lastError = error;
      const retryable =
        axios.isAxiosError(error) &&
        (!error.response || RETRYABLE_STATUS.has(error.response.status));
      if (!retryable || attempt === attempts - 1) throw error;
      await wait(400 * 2 ** attempt);
    }
  }
  throw lastError;
}

export async function login(username: string, password: string) {
  const { data } = await apiClient.post("/auth/login/", { username, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function logout() {
  try { await apiClient.post("/auth/logout/"); } finally { clearTokens(); }
}

export async function fetchMe() {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}
