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
  attendeeEmail?: string | null;
  attendeePhone?: string | null;
  ticketType: string;
  unitPriceKip?: number;
  customAnswers?: Record<string, string | string[]> | null;
  checkedInAt: string;
  checkedInBy: string;
  gate: string | null;
}

export interface OrganizerAttendeeRow {
  id: string;
  tierId?: string;
  ticketCode: string;
  tierName: string;
  unitPriceKip: number;
  status: "valid" | "checked_in";
  attendeeName: string | null;
  attendeeEmail: string | null;
  attendeePhone: string | null;
  customAnswers?: Record<string, string | string[]> | null;
  createdAt?: string;
  selectedDate: string | null;
  selectedTime: string | null;
  paidAt: string | null;
  checkedInAt: string | null;
  gate: string | null;
  checkedInBy?: string | null;
  orderNumber: string;
}

export interface OrganizerCouponRedemption {
  id: string;
  couponCode: string;
  eventId: string;
  eventTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  orderId: string;
  tierName: string;
  discountSaved: number;
  totalPaid: number;
  usedAt: string;
}

export interface OrganizerPayoutRow {
  eventId: string;
  eventTitle: string;
  eventStatus: string;
  eventDate: string | null;
  ticketsSold: number;
  grossKip: number;
  feePercent: number;
  feeKip: number;
  payoutKip: number;
  status: "pending" | "paid";
  hasBill: boolean;
  paidAt: string | null;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
}

export interface OrganizerAnalyticsEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  ticketsSold: number;
  totalCapacity: number;
  grossRevenue: number;
  feePercent: number;
  netPayout: number;
  checkInCount: number;
  tierBreakdown: Array<{
    id: string;
    name: string;
    price: number;
    available: number;
    sold: number;
    revenue: number;
    fillRate: number;
  }>;
  dailySales: Array<{
    date: string;
    dayOfWeek: number;
    revenue: number;
    cumulativeRevenue: number;
    tickets: number;
    cumulativeTickets: number;
  }>;
  hourlyPurchases24: number[];
  hourlyCheckins24: number[];
  demographics: {
    gender: {
      male: number;
      female: number;
      unspecified: number;
    };
    ageGroups: Array<{
      age: string;
      male: number;
      female: number;
    }>;
  };
}

export interface EventStaffAssignment {
  id: string;
  eventId: string;
  userId: string;
  assignedAt: string;
  user: {
    id: string;
    authEmail: string | null;
    firstName: string | null;
    lastName: string | null;
  };
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
      if (res.status === 401 && token && !path.startsWith("/otp/")) {
        safeStorage.removeItem("token");
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
    query?: {
      mine?: boolean;
      status?: string;
      limit?: number;
      cursor?: string;
    },
    opts?: RequestOptions,
  ) => {
    const params = new URLSearchParams();
    if (query?.mine) params.set("mine", "true");
    if (query?.status) params.set("status", query.status);
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return request<{
      events: Record<string, unknown>[];
      nextCursor: string | null;
    }>("GET", `/events${qs ? `?${qs}` : ""}`, undefined, opts);
  },

  getEvent: (idOrRef: string, opts?: RequestOptions) =>
    request<{ event: Record<string, unknown> }>(
      "GET",
      `/events/${encodeURIComponent(idOrRef)}`,
      undefined,
      opts,
    ),

  listOrganizerAttendees: (
    eventId: string,
    query?: { q?: string; limit?: number; cursor?: string },
    opts?: RequestOptions,
  ) => {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.limit) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return request<{
      attendees: OrganizerAttendeeRow[];
      stats: {
        totalPaid: number;
        checkedIn: number;
        notCheckedIn: number;
        totalIncomeKip: number;
      };
      couponRedemptions: OrganizerCouponRedemption[];
      nextCursor: string | null;
    }>(
      "GET",
      `/organizer/events/${encodeURIComponent(eventId)}/attendees${qs ? `?${qs}` : ""}`,
      undefined,
      opts,
    );
  },

  rescheduleOrganizerAttendee: (
    eventId: string,
    itemId: string,
    body: { selectedDate: string; selectedTime?: string | null },
    opts?: RequestOptions,
  ) =>
    request<{
      booking: {
        id: string;
        orderNumber: string;
        selectedDate: string | null;
        selectedTime: string | null;
      };
    }>(
      "PATCH",
      `/organizer/events/${encodeURIComponent(eventId)}/attendees/${encodeURIComponent(itemId)}/schedule`,
      body,
      opts,
    ),

  createOrganizerWalkin: (
    eventId: string,
    body: {
      attendeeName: string;
      attendeePhone?: string | null;
      attendeeEmail?: string | null;
      selectedDate: string;
      selectedTime?: string | null;
      tierId?: string;
      quantity?: number;
      markCheckedIn?: boolean;
    },
    opts?: RequestOptions,
  ) =>
    request<{ orderNumber: string; items: Record<string, unknown>[] }>(
      "POST",
      `/organizer/events/${encodeURIComponent(eventId)}/walkin`,
      body,
      opts,
    ),

  getBookingOverrides: (eventId: string, opts?: RequestOptions) =>
    request<{ overrides: Record<string, unknown> }>(
      "GET",
      `/organizer/events/${encodeURIComponent(eventId)}/booking-overrides`,
      undefined,
      opts,
    ),

  saveBookingOverrides: (
    eventId: string,
    overrides: Record<string, unknown>,
    opts?: RequestOptions,
  ) =>
    request<{ overrides: Record<string, unknown> }>(
      "PUT",
      `/organizer/events/${encodeURIComponent(eventId)}/booking-overrides`,
      { overrides },
      opts,
    ),

  getOrganizerPayouts: (opts?: RequestOptions) =>
    request<{
      bankAccount: {
        bankName: string;
        accountName: string;
        accountNumber: string;
        updatedAt: string;
      } | null;
      payouts: OrganizerPayoutRow[];
    }>("GET", "/organizer/payouts", undefined, opts),

  getOrganizerPayoutBillUrl: (eventId: string, opts?: RequestOptions) =>
    request<{ url: string }>(
      "GET",
      `/organizer/payouts/${encodeURIComponent(eventId)}/bill`,
      undefined,
      opts,
    ),

  updateOrganizerBankDetails: (
    body: { bankName: string; accountHolder: string; accountNumber: string },
    opts?: RequestOptions,
  ) =>
    request<{
      bankAccount: {
        bankName: string;
        accountName: string;
        accountNumber: string;
        updatedAt: string;
      };
    }>("PUT", "/organizer/bank-details", body, opts),

  getOrganizerAnalytics: (opts?: RequestOptions) =>
    request<{ events: OrganizerAnalyticsEvent[] }>(
      "GET",
      "/organizer/analytics",
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
    }>("PUT", `/events/${encodeURIComponent(idOrRef)}`, patch, opts),

  listOrders: (opts?: RequestOptions) =>
    request<{ tickets: Record<string, unknown>[] }>(
      "GET",
      "/tickets",
      undefined,
      opts,
    ),

  requestOrderRefund: (
    orderId: string,
    reason?: string,
    opts?: RequestOptions,
  ) =>
    request<{
      success: true;
      order: Record<string, unknown>;
      refund: Record<string, unknown> | null;
    }>(
      "POST",
      `/tickets/${encodeURIComponent(orderId)}/refund`,
      reason ? { reason } : {},
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
      paymentMethod?:
        | "bcel"
        | "ldb"
        | "jdb"
        | "ib"
        | "stb"
        | "apb"
        | "m-money"
        | "credit_card"
        | "payment_link";
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
      checkout: {
        provider: string;
        transactionId: string | null;
        checkoutUrl: string | null;
        deepLink?: string | null;
        qrCode?: string | null;
        expiresAt: string;
      } | null;
    }>("POST", "/tickets", order, opts),

  getPaymentStatus: (reference: string, opts?: RequestOptions) =>
    request<{
      status: string;
      verified: boolean;
      orderId?: string;
      orderNumber?: string;
    }>(
      "GET",
      `/payment/status/${encodeURIComponent(reference)}`,
      undefined,
      opts,
    ),

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
    request<{
      status: "checked_in" | "already_checked_in";
      checkIn: BackendCheckIn;
    }>("POST", "/checkins", scan, opts),

  listCheckins: (eventId: string, opts?: RequestOptions) =>
    request<{ checkIns: BackendCheckIn[] }>(
      "GET",
      `/checkins?eventId=${encodeURIComponent(eventId)}`,
      undefined,
      opts,
    ),

  listScannerEvents: (opts?: RequestOptions) =>
    request<{ events: ScannerEvent[] }>(
      "GET",
      "/checkins/events",
      undefined,
      opts,
    ),

  listEventStaff: (eventId: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment[] }>(
      "GET",
      `/events/${encodeURIComponent(eventId)}/staff`,
      undefined,
      opts,
    ),

  assignEventStaff: (eventId: string, email: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment }>(
      "POST",
      `/events/${encodeURIComponent(eventId)}/staff`,
      { email },
      opts,
    ),

  revokeEventStaff: (eventId: string, userId: string, opts?: RequestOptions) =>
    request<{ staff: EventStaffAssignment }>(
      "DELETE",
      `/events/${encodeURIComponent(eventId)}/staff/${encodeURIComponent(userId)}`,
      undefined,
      opts,
    ),

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
        checkedInBy?: string | null;
        gate?: string | null;
      };
    }>("GET", `/checkins/lookup/${encodeURIComponent(code)}`, undefined, opts),

  getNotifications: (opts?: RequestOptions) =>
    request<{
      notifications: import("../types").AppNotification[];
      unreadCount: number;
    }>("GET", "/notifications", undefined, opts),

  getNotificationPreferences: (opts?: RequestOptions) =>
    request<{ preferences: import("../types").NotificationPreferences }>(
      "GET",
      "/notification-preferences",
      undefined,
      opts,
    ),

  saveNotificationPreferences: (
    preferences: import("../types").NotificationPreferences,
    opts?: RequestOptions,
  ) =>
    request<{ preferences: import("../types").NotificationPreferences }>(
      "PUT",
      "/notification-preferences",
      preferences,
      opts,
    ),

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
export async function listAllMyEvents(
  opts?: RequestOptions,
): Promise<Record<string, unknown>[]> {
  const events: Record<string, unknown>[] = [];
  let cursor: string | undefined;
  do {
    const result = await api.listEvents(
      { mine: true, limit: 100, cursor },
      { ...opts, throwOnError: true },
    );
    if (!result.data) throw new Error("Could not load your events");
    events.push(...result.data.events);
    cursor = result.data.nextCursor ?? undefined;
  } while (cursor);
  return events;
}

/** Fetch every page of paid attendees + stats + coupon redemptions for an organizer event. */
export async function listAllOrganizerAttendees(
  eventId: string,
  opts?: RequestOptions,
): Promise<{
  attendees: OrganizerAttendeeRow[];
  stats: {
    totalPaid: number;
    checkedIn: number;
    notCheckedIn: number;
    totalIncomeKip: number;
  };
  couponRedemptions: OrganizerCouponRedemption[];
}> {
  const attendees: OrganizerAttendeeRow[] = [];
  let stats = { totalPaid: 0, checkedIn: 0, notCheckedIn: 0, totalIncomeKip: 0 };
  let couponRedemptions: OrganizerCouponRedemption[] = [];
  let cursor: string | undefined;
  let isFirstPage = true;
  do {
    const res = await api.listOrganizerAttendees(
      eventId,
      { limit: 500, cursor },
      opts,
    );
    if (!res.ok || !res.data) {
      throw new Error(res.error || "Could not load attendees");
    }
    attendees.push(...res.data.attendees);
    if (isFirstPage) {
      stats = res.data.stats;
      couponRedemptions = res.data.couponRedemptions ?? [];
      isFirstPage = false;
    }
    cursor = res.data.nextCursor ?? undefined;
  } while (cursor);
  return { attendees, stats, couponRedemptions };
}
