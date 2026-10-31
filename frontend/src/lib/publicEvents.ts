import { api } from "./api";

let cachedEvents: { data: Record<string, unknown>[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 45 * 1000; // 45s in-memory cache to prevent duplicate fetches across page changes

export function invalidatePublicEventsCache() {
  cachedEvents = null;
}

/** Fetch every page of the public event catalog without using demo data. */
export async function listAllPublicEvents(options?: { forceRefresh?: boolean }) {
  const now = Date.now();
  if (!options?.forceRefresh && cachedEvents && cachedEvents.expiresAt > now) {
    return { ok: true as const, events: cachedEvents.data };
  }

  const events: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  do {
    const result = await api.listEvents({ limit: 100, ...(cursor ? { cursor } : {}) });
    if (!result.ok || !result.data) {
      if (cachedEvents && cachedEvents.data.length > 0) {
        return { ok: true as const, events: cachedEvents.data };
      }
      return { ok: false as const, events: [], error: result.error ?? "Unable to load events" };
    }

    events.push(...result.data.events);
    const nextCursor = result.data.nextCursor ?? undefined;
    if (nextCursor && nextCursor === cursor) {
      return { ok: false as const, events: [], error: "Event pagination did not advance" };
    }
    cursor = nextCursor;
  } while (cursor);

  cachedEvents = { data: events, expiresAt: now + CACHE_TTL_MS };
  return { ok: true as const, events };
}
