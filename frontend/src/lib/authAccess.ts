import { safeStorage } from "./storage";

export const SESSION_EXPIRED_EVENT = "pasopkan:session-expired";
export const LOGIN_RETURN_KEY = "pasopkan:login-return";
export const LAST_ACTIVITY_KEY = "pasopkan:last-activity";
export const USER_ACTIVITY_EVENT = "pasopkan:user-activity";

/** Standard 30-minute inactivity timeout (OWASP standard session idle timeout) */
export const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function getIdleTimeoutMs(): number {
  const envMinutes = typeof import.meta !== "undefined" ? Number(import.meta.env?.VITE_IDLE_TIMEOUT_MINUTES) : NaN;
  if (Number.isFinite(envMinutes) && envMinutes > 0) {
    return envMinutes * 60 * 1000;
  }
  return DEFAULT_IDLE_TIMEOUT_MS;
}

let lastRecordedActivity = 0;

export function recordUserActivity(): void {
  const now = Date.now();
  // Throttle updates to at most once every 3 seconds
  if (now - lastRecordedActivity < 3000) return;
  lastRecordedActivity = now;
  try {
    safeStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(USER_ACTIVITY_EVENT, { detail: { timestamp: now } }));
  }
}

export function getLastActivityTime(): number {
  try {
    const val = safeStorage.getItem(LAST_ACTIVITY_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function clearLastActivity(): void {
  try {
    safeStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {}
}

/** Only an account session may mount application pages. Storage tokens alone are insufficient. */
export function hasAccountSession(user: { id: string; is_anonymous?: boolean } | null, token: string | null) {
  return Boolean(user?.id && !user.is_anonymous && token);
}

/** Never navigate to an external URL or back into the sign-in flow after login. */
export function safeLoginReturn(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f]/.test(decoded)) return "/";
    const url = new URL(value, "https://pasopkan.local");
    if (url.origin !== "https://pasopkan.local" || /^\/(login|register)\/?$/i.test(url.pathname)) return "/";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/";
  }
}
