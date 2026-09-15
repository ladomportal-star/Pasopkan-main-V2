/**
 * Maps the organizer-facing event object (the shape stored in the
 * `organizer_events` localStorage list) to the backend `POST/PUT /api/events`
 * payload. Best-effort: unknown / empty fields are omitted so validation
 * never rejects a partially-filled draft.
 */

const CATEGORIES = ["Sports", "Workshop", "Festival", "Voucher", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

const toCategory = (c: unknown): Category =>
  (CATEGORIES as readonly string[]).includes(String(c)) ? (c as Category) : "Other";

const toStatus = (s: unknown): "draft" | "published" => {
  const v = String(s ?? "").toLowerCase();
  return v === "active" || v === "published" ? "published" : "draft";
};

const num = (v: unknown): number => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
const str = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeEvent = any;

export function toEventPayload(e: FeEvent): Record<string, unknown> {
  const dateType = ["fixed", "flexible", "booking"].includes(e.dateType) ? e.dateType : "fixed";

  return {
    legacyId: e.id != null ? String(e.id) : undefined,
    title: str(e.title) ?? "Untitled event",
    description: str(e.description),
    category: toCategory(e.category),
    eventType: str(e.eventType),
    status: toStatus(e.status),

    dateType,
    startDate: str(e.date) ?? str(e.startDate),
    startTime: str(e.time) ?? str(e.startTime),
    endDate: str(e.endDate),
    endTime: str(e.endTime),
    flexibleDateDesc: str(e.flexibleDateDesc),

    venueName: str(e.venue) ?? str(e.venueName),
    addressText: str(e.location) ?? str(e.streetAddress),
    province: str(e.province),
    district: str(e.district),
    latitude: e.latitude === "" || e.latitude == null ? undefined : Number(e.latitude),
    longitude: e.longitude === "" || e.longitude == null ? undefined : Number(e.longitude),
    googleMapUrl: str(e.googleMapUrl) ?? str(e.googleMapsLink),

    coverImageUrl: str(e.image),
    galleryUrls: Array.isArray(e.exampleImages) ? e.exampleImages : undefined,
    languages: Array.isArray(e.languages) ? e.languages : undefined,

    hasSeating: !!e.hasSeating,
    zoneImageUrl: str(e.zoneImage),
    allowReviews: e.allowReviews !== false,
    allowRefunds: !!e.allowRefunds,
    showRemainingTickets: e.showRemainingTickets !== false,
    enableCountdown: !!e.enableCountdown,

    organizer: e.organizer
      ? {
          name: String(e.organizer),
          description: str(e.organizerInfo),
          contactEmail: str(e.organizerEmail),
          contactPhone: str(e.organizerPhone) ?? str(e.organizerContact),
          logoUrl: str(e.organizerLogo),
        }
      : undefined,

    tiers: (e.ticketTiers ?? [])
      .filter((t: FeEvent) => t?.name)
      .map((t: FeEvent) => ({
        name: String(t.name),
        priceKip: num(t.price),
        quantityTotal: t.available != null ? num(t.available) || null : null,
      })),

    zones: (e.seatingZones ?? e.zones ?? [])
      .filter((z: FeEvent) => z?.name)
      .map((z: FeEvent) => ({
        name: String(z.name),
        priceKip: num(z.price),
        capacity: num(z.capacity),
      })),

    dates: (e.availableDates ?? [])
      .filter((d: FeEvent) => d?.date)
      .map((d: FeEvent) => ({
        date: String(d.date),
        startTime: str(d.startTime),
        endTime: str(d.endTime),
        timeSlots: Array.isArray(d.timeSlots) ? d.timeSlots : undefined,
      })),

    coupons: (e.coupons ?? [])
      .filter((c: FeEvent) => c?.code)
      .map((c: FeEvent) => ({
        code: String(c.code),
        discountType: c.discountType === "fixed" || c.type === "fixed" ? "fixed" : "percent",
        discountValue: num(c.discountValue ?? c.percentage ?? c.amount ?? c.value),
      })),
  };
}
