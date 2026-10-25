import { api } from "./api";

/** Fetch every page of the public event catalog without using demo data. */
export async function listAllPublicEvents() {
  const events: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  do {
    const result = await api.listEvents({ limit: 100, ...(cursor ? { cursor } : {}) });
    if (!result.ok || !result.data) {
      return { ok: false as const, events: [], error: result.error ?? "Unable to load events" };
    }

    events.push(...result.data.events);
    const nextCursor = result.data.nextCursor ?? undefined;
    if (nextCursor && nextCursor === cursor) {
      return { ok: false as const, events: [], error: "Event pagination did not advance" };
    }
    cursor = nextCursor;
  } while (cursor);

  return { ok: true as const, events };
}
