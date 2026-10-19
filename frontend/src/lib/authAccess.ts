export const SESSION_EXPIRED_EVENT = "pasopkan:session-expired";
export const LOGIN_RETURN_KEY = "pasopkan:login-return";

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
