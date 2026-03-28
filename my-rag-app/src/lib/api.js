import { AUTH_API, CONTENT_API, USER_API, CONVO_API } from "./constants";

let isLoggingOut = false;
let refreshPromise = null;

export function setLoggingOut(val) {
  isLoggingOut = val;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function dispatchSessionExpired() {
  if (isLoggingOut) return;
  window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function friendlyError(message, status) {
  if (message && message.trim()) return message.trim();
  if (status === 429) return "You're going too fast. Please wait a moment and try again.";
  if (status === 401) return "Session expired. Please sign in again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "Not found.";
  if (status >= 500) return "Server error. Please try again in a moment.";
  return "Something went wrong.";
}

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = fetch(`${AUTH_API}/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then(async (res) => {
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.message || "Session expired. Please sign in again.");
      return data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export async function fetchWithRefresh(url, options = {}, _isRetry = false) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (res.status === 401 && !_isRetry) {
    if (isLoggingOut) {
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
    try {
      await refreshAccessToken();
      return fetchWithRefresh(url, options, true);
    } catch {
      dispatchSessionExpired();
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
  }
  return res;
}

export async function publicFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = friendlyError(data.message, res.status);
    throw new ApiError(msg, res.status);
  }
  return data;
}

export async function apiFetch(url, options = {}) {
  const res = await fetchWithRefresh(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = friendlyError(data.message, res.status);
    throw new ApiError(msg, res.status);
  }
  return data;
}

export async function apiPost(path, body) {
  return publicFetch(`${AUTH_API}${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function checkAuth() {
  try {
    const data = await apiFetch(`${USER_API}/me`);
    if (data?.data?.user) setStoredUser(data.data.user);
    return data?.data?.user || true;
  } catch {
    return false;
  }
}

export const toast = {
  success: (msg) => emitToast({ type: "success", msg }),
  error: (msg) => emitToast({ type: "error", msg }),
  info: (msg) => emitToast({ type: "info", msg }),
  warn: (msg) => emitToast({ type: "warn", msg }),
};

function emitToast(detail) {
  window.dispatchEvent(new CustomEvent("app:toast", { detail }));
}
