// Typed client for the Pasopkan backend API. In development, an empty
// VITE_API_URL uses Vite's same-origin /api proxy. In production, set it to
// the Railway origin (for example https://api.pasopkan.la).
// Helpers are non-throwing by default: failures resolve to `{ ok: false, ... }`.
// Pass `{ throwOnError: true }` to get an exception instead.
import { safeStorage } from "./storage";
import { prepareMedia, resolveMedia } from "./media";
import { SESSION_EXPIRED_EVENT } from "./authAccess";

const configuredApiOrigin = String(import.meta.env.VITE_API_URL ?? "").trim();

if (configuredApiOrigin && !/^https?:\/\//i.test(configuredApiOrigin)) {
  throw new Error(
    "VITE_API_URL must be an absolute http(s) origin, for example https://api.pasopkan.la",
  );
}

const apiOrigin = configuredApiOrigin.replace(/\/+$/, "");

/** Fully-qualified in production; same-origin in local development. */
export const API_BASE_URL = `${apiOrigin}/api`;

/** Build an API URL without duplicating or omitting the `/api` prefix. */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

interface RequestOptions {
  token?: string | null;
  throwOnError?: boolean;
  signal?: AbortSignal;
}

/** Shape of the `users` row the backend returns from `/account/sync`. */
export interface BackendUser {
  id: string;
  authId: string;
  publicId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  avatarUrlDisplay?: string | null;
  role: "user" | "organizer" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface ScannerEvent {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  venueName: string | null;
}

export interface BackendCheckIn {
  id: string;
  ticketCode: string;
  eventId: string;
  attendeeName: string | null;
  ticketType: string;
  checkedInAt: string;
  checkedInBy: string;
  gate: string | null;
}

export interface EventStaffAssignment {
  id: string;
  eventId: string;
  userId: string;
  assignedAt: string;
  user: { id: string; authEmail: string | null; firstName: string | null; lastName: string | null };
}

function authToken(explicit?: string | null): string | null {
  return explicit ?? safeStorage.getItem("token") ?? null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = authToken(opts.token);
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const mediaRequest = path.startsWith("/media");
    const payload = mediaRequest
      ? body
      : await prepareMedia(body, async (dataUrl, visibility) => {
          const result = await request<{ reference: string }>(
            "POST",
            "/media",
            { dataUrl, visibility },
            { ...opts, throwOnError: true },
          );
          if (!result.data?.reference)
            throw new Error("Image upload returned no reference");
          return result.data.reference;
        });
    const res = await fetch(apiUrl(path), {
      method,
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
      signal: opts.signal,
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : null;

    if (!res.ok) {
      if (res.status === 401 && token && !path.startsWith('/otp/')) {
        safeStorage.removeItem('token');
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      }
      const error = (data as { error?: string })?.error || `HTTP ${res.status}`;
      if (opts.throwOnError) throw new Error(error);
      return { ok: false, status: res.status, data, error };
    }
    const resolved = mediaRequest
      ? data
      : await resolveMedia(data, async (reference) => {
          const result = await request<{ url: string }>(
            "GET",
            `/media/url?reference=${encodeURIComponent(reference)}`,
            undefined,
            { ...opts, throwOnError: true },
          );
          if (!result.data?.url) throw new Error("Image unavailable");
          return result.data.url;
        });
    return { ok: true, status: res.status, data: resolved as T | null };
  } catch (err) {
    if (opts.throwOnError) throw err;
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("POST", path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PUT", path, body, opts),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>("PATCH", path, body, opts),
  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>("DELETE", path, undefined, opts),

  /* ---- domain helpers ---- */

  syncAccount: (
    profile: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      gender?: "male" | "female" | "other";
      dateOfBirth?: string;
      avatarUrl?: string;
    },
    opts?: RequestOptions,
  ) =>
    request<{ success: true; user: BackendUser }>(
      "POST",
      "/account/sync",
      profile,
      opts,
    ),

  sendPhoneOtp: (phone: string, captchaToken?: string, opts?: RequestOptions) =>
    request<{ success: true; cooldownSeconds: number }>(
      "POST",
      "/otp/send",
      { phone, captchaToken },
      opts,
    ),

  verifyPhoneOtp: (phone: string, code: string, opts?: RequestOptions) =>
    request<{
      success: true;
      session: { accessToken: string; refreshToken: string; expiresIn: number };
    }>("POST", "/otp/verify", { phone, code }, opts),

  listEvents: (
    query?: { mine?: boolean; status?: string; limit?: number; cursor?: string },
    opts?: RequestOptions,
  ) => {
    const params = new URLSearchParams();
    if (query?.mine) params.set("mine", "true");
    if (query?.status) params.set("status", query.status);
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return request<{ events: Record<string, unknown>[]; nextCursor: string | null }>(
      "GET",
      `/events${qs ? `?${qs}` : ""}`,
      undefined,
      opts,
    );
  },

  getEvent: (idOrRef: string, opts?: RequestOptions) =>
    request<{ event: Record<string, unknown> }>(
      "GET",
      `/events/${encodeURIComponent(idOrRef)}`,
      undefined,
      opts,
    ),

  createEvent: (event: Record<string, unknown>, opts?: RequestOptions) =>
    request<{
      event: Record<string, unknown>;
      smsNotification?: "accepted" | "unavailable";
    }>("POST", "/events", event, opts),

  updateEvent: (
    idOrRef: string,
    patch: Record<string, unknown>,
    opts?: RequestOptions,
  ) =>
    request<{
      event: Record<string, unknown>;
      smsNotification?: "accepted" | "unavailable";
    }>(
      "PUT",
      `/events/${encodeURIComponent(idOrRef)}`,
      patch,
      opts,
    ),

  listOrders: (opts?: RequestOptions) =>
    request<{ tickets: Record<string, unknown>[] }>(
      "GET",
      "/tickets",
      undefined,
      opts,
    ),

  createOrder: (
    order: {
      eventId: string;
      tierId: string;
      tierName?: string;
      quantity: number;
      selectedDate?: string;
      selectedTime?: string;
      paymentTxnId?: string;
      freeOnly?: boolean;
      couponCode?: string;
      attendees?: Array<{
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        customAnswers?: Record<string, string | string[]>;
      }>;
    },
    opts?: RequestOptions,
  ) =>
    request<{
      success: true;
      order: Record<string, unknown>;
      items: Record<string, unknown>[];
    }>("POST", "/tickets", order, opts),

  scanCheckin: (
    scan: {
      ticketCode: string;
      eventId: string;
      attendeeName?: string;
      ticketType?: string;
      seatLabel?: string;
      gate?: string;
      note?: string;
    },
    opts?: RequestOptions,
  ) =>
    request<{ status: "checked_in" | "already_checked_in"; checkIn: BackendCheckIn }>(
      "POST",
      "/checkins",
      scan,
      opts,
    ),

  listCheckins: (eventId: string, opts?: RequestOptions) =>
    request<{ checkIns: BackendCheckIn[] }>(
      "GET",
      `/checkins?eventId=${encodeURIComponent(eventId)}`,
      undefined,
      opts,
    ),

  listScannerEvents: (opts?: RequestOptions) =>
    request<{ events: ScannerEvent[] }>("GET", "/checkins/events", undefined, opts),

  listEventStaff: (eventId: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment[] }>("GET", `/events/${encodeURIComponent(eventId)}/staff`, undefined, opts),

  assignEventStaff: (eventId: string, email: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment }>("POST", `/events/${encodeURIComponent(eventId)}/staff`, { email }, opts),

  revokeEventStaff: (eventId: string, userId: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment }>("DELETE", `/events/${encodeURIComponent(eventId)}/staff/${encodeURIComponent(userId)}`, undefined, opts),

  /** Preview a scanned ticket code against the real order — does NOT check it in. */
  lookupTicket: (code: string, opts?: RequestOptions) =>
    request<{
      ticket: {
        ticketCode: string;
        itemStatus: string;
        orderStatus: string | null;
        eventId: string | null;
        eventTitle: string | null;
        orderCreatedAt: string | null;
        tierName: string;
        seatLabel?: string | null;
        zoneName?: string | null;
        unitPriceKip: number;
        attendeeName: string | null;
        attendeeEmail: string | null;
        attendeePhone: string | null;
        customAnswers: Record<string, string | string[]> | null;
        alreadyCheckedIn: boolean;
        checkedInAt: string | null;
      };
    }>("GET", `/checkins/lookup/${encodeURIComponent(code)}`, undefined, opts),

  getNotifications: (opts?: RequestOptions) =>
    request<{
      notifications: import("../types").AppNotification[];
      unreadCount: number;
    }>("GET", "/notifications", undefined, opts),

  markNotificationRead: (id: string, opts?: RequestOptions) =>
    request(
      "PATCH",
      `/notifications/${encodeURIComponent(id)}/read`,
      undefined,
      opts,
    ),

  markAllNotificationsRead: (opts?: RequestOptions) =>
    request("POST", "/notifications/read-all", undefined, opts),

  deleteNotification: (id: string, opts?: RequestOptions) =>
    request(
      "DELETE",
      `/notifications/${encodeURIComponent(id)}`,
      undefined,
      opts,
    ),

  clearNotifications: (opts?: RequestOptions) =>
    request("DELETE", "/notifications", undefined, opts),

  // Optional notification creation is best-effort; callers should supply the
  // authenticated recipient UID and rely on the server as the source of truth.
  createNotification: (
    data: Partial<import("../types").AppNotification> & { userUid?: string },
    opts?: RequestOptions,
  ) =>
    request<{ notification: import("../types").AppNotification }>(
      "POST",
      "/notifications",
      data,
      opts,
    ),
};

/** Fetch every page of the signed-in organizer's events; never use the public catalog. */
export async function listAllMyEvents(opts?: RequestOptions): Promise<Record<string, unknown>[]> {
  const events: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const result = await api.listEvents({ mine: true, limit: 100, cursor }, { ...opts, throwOnError: true });
    if (!result.data) throw new Error("Could not load your events");
    events.push(...result.data.events);
    cursor = result.data.nextCursor ?? undefined;
  } while (cursor);
  return events;
}
