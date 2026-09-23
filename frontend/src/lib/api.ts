/**
 * Typed client for the Pasopkan backend API.
 *
 * In dev, Vite proxies `/api/*` to the backend (see vite.config.ts). In
 * production the frontend and backend share an origin (or CORS is set).
 *
 * All helpers are non-throwing by default: on a network error or non-2xx
 * response they resolve to `{ ok: false, ... }` so callers can dual-write
 * to Firestore/localStorage without a try/catch. Pass `{ throwOnError: true }`
 * when you do want an exception.
 */
import { safeStorage } from './storage';

const BASE = '/api';

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

function authToken(explicit?: string | null): string | null {
  return explicit ?? safeStorage.getItem('token') ?? null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: RequestOptions = {},
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = authToken(opts.token);
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: opts.signal,
    });

    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : null;

    if (!res.ok) {
      const error = (data as { error?: string })?.error || `HTTP ${res.status}`;
      if (opts.throwOnError) throw new Error(error);
      return { ok: false, status: res.status, data, error };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    if (opts.throwOnError) throw err;
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, body, opts),

  /* ---- domain helpers ---- */

  syncAccount: (
    profile: { email: string; displayName?: string; phone?: string; avatarUrl?: string },
    opts?: RequestOptions,
  ) => request('POST', '/account/sync', profile, opts),

  createEvent: (event: Record<string, unknown>, opts?: RequestOptions) =>
    request<{ event: { id: string } }>('POST', '/events', event, opts),

  updateEvent: (idOrRef: string, patch: Record<string, unknown>, opts?: RequestOptions) =>
    request<{ event: { id: string } }>('PUT', `/events/${encodeURIComponent(idOrRef)}`, patch, opts),

  createReview: (
    review: {
      eventId: string;
      rating: number;
      comment: string;
      userName?: string;
      userRealName?: string;
      date?: string;
      avatarUrl?: string;
    },
    opts?: RequestOptions,
  ) => request('POST', '/reviews', review, opts),

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
  ) => request<{ status: 'checked_in' | 'already_checked_in' }>('POST', '/checkins', scan, opts),

  listCheckins: (eventId: string, opts?: RequestOptions) =>
    request<{ checkIns: unknown[] }>(
      'GET',
      `/checkins?eventId=${encodeURIComponent(eventId)}`,
      undefined,
      opts,
    ),

  getNotifications: (opts?: RequestOptions) =>
    request<{ notifications: import('../types').AppNotification[]; lastFetchedAt?: string }>(
      'GET',
      '/notifications',
      undefined,
      opts,
    ),

  createNotification: (data: Partial<import('../types').AppNotification>, opts?: RequestOptions) =>
    request<{ notification: import('../types').AppNotification }>(
      'POST',
      '/notifications',
      data,
      opts,
    ),
};
