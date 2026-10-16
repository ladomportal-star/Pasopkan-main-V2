// Maps the organizer-facing event object to the backend `/api/events` payload.
// Unknown/empty fields are omitted so validation never rejects a partial draft.
// `fromBackendEvent` reverses this: backend row -> the `LaoEvent`-ish shape
// every page component already renders, so wiring a page to the real API is
// a data-source swap, not a rewrite.

const CATEGORIES = ["Sports", "Workshop", "Festival", "Voucher", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

const toCategory = (c: unknown): Category =>
  (CATEGORIES as readonly string[]).includes(String(c)) ? (c as Category) : "Other";

const toStatus = (s: unknown): "draft" | "pending_review" => {
  const v = String(s ?? "").toLowerCase();
  return ["active", "published", "pending", "pending_review"].includes(v) ? "pending_review" : "draft";
};

const num = (v: unknown): number => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
const str = (v: unknown): string | undefined => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

// Form dates may be DD/MM/YYYY; the API and database use calendar ISO dates.
const day = (v: unknown): string | undefined => {
  const value = str(v);
  if (!value) return undefined;
  const local = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value);
  return local ? `${local[3]}-${local[2].padStart(2, "0")}-${local[1].padStart(2, "0")}` : value.slice(0, 10);
};
const boundary = (value: unknown, end = false): string | null => {
  if (typeof value === "string" && value.includes("T")) return new Date(value).toISOString();
  const date = day(value);
  return date ? new Date(`${date}T${end ? "23:59:59.999" : "00:00:00"}+07:00`).toISOString() : null;
};
const optionalLimit = (value: unknown): number | null =>
  value == null || value === "" || value === "unlimited" ? null : num(value) || null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeEvent = any;

export function toEventPayload(e: FeEvent): Record<string, unknown> {
  const canonicalImage = (url: string) => e.mediaReferences?.[url] ?? url;
  const dateType = ["fixed", "flexible", "booking"].includes(e.dateType) ? e.dateType : "fixed";
  const calendarDates = (dateType === "booking" ? e.bookingAvailableDays ?? [] :
    dateType === "flexible" ? (e.availableDates ?? []).map((d: FeEvent) => d.date) : [])
    .map(day).filter(Boolean).sort();
  const sessions = dateType === "flexible" ? [...(e.availableDates ?? [])]
    .sort((a, b) => String(day(a.date)).localeCompare(String(day(b.date)))) : [];

  return {
    title: str(e.title) ?? "Untitled event",
    description: String(e.description ?? ""),
    category: toCategory(e.category),
    eventType: str(e.eventType),
    eventPrivacy: e.eventPrivacy === "private" ? "private" : "public",
    durationEn: str(e.durationEn),
    durationLo: str(e.durationLo),
    cancellationPolicy: str(e.cancellationPolicy) ?? null,
    attendeeMessage: str(e.attendeeMessage) ?? null,
    status: toStatus(e.status),

    dateType,
    startDate: calendarDates[0] ?? day(e.date) ?? day(e.startDate) ?? null,
    startTime: str(sessions[0]?.startTime) ?? (dateType === "booking" ? str(e.bookingTimeSlots?.[0]) : undefined) ?? str(e.time) ?? str(e.startTime) ?? null,
    endDate: calendarDates.at(-1) ?? day(e.endDate) ?? null,
    endTime: str(sessions.at(-1)?.endTime) ?? str(e.endTime) ?? null,
    flexibleDateDesc: dateType === "flexible" ? str(e.flexibleDateDesc) ?? null : null,

    venueName: str(e.venue) ?? str(e.venueName),
    addressText: str(e.location) ?? str(e.streetAddress),
    province: str(e.province),
    district: str(e.district),
    latitude: e.latitude === "" || e.latitude == null ? undefined : Number(e.latitude),
    longitude: e.longitude === "" || e.longitude == null ? undefined : Number(e.longitude),
    googleMapUrl: str(e.googleMapUrl) ?? str(e.googleMapsLink) ?? null,

    coverImageUrl: str(canonicalImage(e.image)) ?? null,
    galleryUrls: Array.isArray(e.exampleImages) ? e.exampleImages.map(canonicalImage) : undefined,
    languages: Array.isArray(e.languages) ? e.languages : undefined,

    hasSeating: !!e.hasSeating,
    zoneImageUrl: str(canonicalImage(e.zoneImage)) ?? null,
    allowReviews: e.allowReviews !== false,
    allowRefunds: !!e.allowRefunds,
    showRemainingTickets: e.showRemainingTickets !== false,
    enableCountdown: !!e.enableCountdown,
    requireEveryTicketInfo: !!e.requireEveryTicketInfo,
    maxTicketsPerOrder: optionalLimit(e.maxTickets),

    privateDetails: {
      bankName: str(e.bankName) ?? null,
      accountNumber: str(e.accountNumber) ?? null,
      accountHolder: str(e.accountHolder) ?? null,
      onlinePlatform: str(e.onlinePlatform) ?? null,
      onlineMeetingUrl: str(e.onlineMeetingUrl) ?? null,
      onlinePasscode: str(e.onlinePasscode) ?? null,
      onlineInstructions: str(e.onlineInstructions) ?? null,
      bookingSlotCapacities: dateType === "booking" ? e.bookingSlotCapacities ?? {} : {},
      attendeeQuestions: (e.attendeeQuestions ?? []).filter((q: FeEvent) => str(q.label)),
      ticketSaleWindows: (e.ticketTiers ?? []).filter((t: FeEvent) => t?.name).map((t: FeEvent) => ({
        saleStartDate: t.saleStartDate, saleEndDate: t.saleEndDate,
        saleStartTime: t.saleStartTime, saleEndTime: t.saleEndTime,
      })),
      organizerSocialLinks: e.organizerSocialLinks ?? {},
    },

    organizer: e.organizer
      ? {
          name: String(e.organizer),
          description: String(e.organizerInfo ?? ""),
          contactEmail: str(e.organizerEmail) ?? null,
          contactPhone: str(e.organizerPhone) ?? str(e.organizerContact) ?? null,
          logoUrl: str(canonicalImage(e.organizerLogo)) ?? null,
        }
      : undefined,

    tiers: (e.ticketTiers ?? [])
      .filter((t: FeEvent) => t?.name)
      .map((t: FeEvent, index: number) => ({
        name: String(t.name),
        sortOrder: index,
        priceKip: num(t.price),
        quantityTotal: t.quantity === "unlimited" ? null : t.quantity != null && t.quantity !== ""
          ? num(t.quantity)
          : t.available != null && Number.isFinite(Number(t.available))
          ? num(t.available) + num(t.sold)
          : null,
      })),

    dates: (dateType === "booking"
      ? (e.bookingAvailableDays ?? []).map((date: string) => ({ date, timeSlots: e.bookingTimeSlots ?? [] }))
      : dateType === "flexible" ? e.availableDates ?? [] : [])
      .filter((d: FeEvent) => d?.date)
      .map((d: FeEvent) => ({
        date: day(d.date),
        startTime: str(d.startTime),
        endTime: str(d.endTime),
        timeSlots: Array.isArray(d.timeSlots) ? d.timeSlots : undefined,
      })),

    coupons: (e.coupons ?? [])
      .filter((c: FeEvent) => c?.code)
      .map((c: FeEvent) => ({
        code: String(c.code),
        discountType: c.discountType === "fixed" || c.type === "fixed" ? "fixed" : "percent",
        discountValue: num(c.discountValue ?? c.discount ?? c.percentage ?? c.amount ?? c.value),
        maxRedemptions: optionalLimit(c.maxUses ?? c.maxRedemptions),
        maxUsesPerUser: optionalLimit(c.maxUsesPerUser),
        maxDiscountAmount: optionalLimit(c.maxDiscountAmount),
        startsAt: boundary(c.validFrom ?? c.startsAt),
        expiresAt: boundary(c.validUntil ?? c.expiresAt, true),
        isActive: c.isActive !== false,
      })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackendEvent = any;

/** Backend `events` row (+ nested tiers/dates/coupons/organizer) -> the page-facing event shape. */
export function fromBackendEvent(e: BackendEvent): FeEvent {
  const mediaReferences: Record<string, string> = {};
  const remember = (ref: unknown, display: unknown) => {
    if (typeof ref === 'string' && ref.startsWith('storage://') && typeof display === 'string' && display) mediaReferences[display] = ref;
  };
  for (const key of ['coverImageUrl', 'zoneImageUrl']) remember(e[key], e[key + 'Display']);
  (e.galleryUrls ?? []).forEach((ref: string, i: number) => remember(ref, e.galleryUrlsDisplay?.[i]));
  remember(e.organizer?.logoUrl, e.organizer?.logoUrlDisplay);
  const availableDates = (e.dates ?? []).map((d: BackendEvent) => ({
    date: day(d.date) ?? "",
    startTime: d.startTime ?? "",
    endTime: d.endTime ?? "",
    timeSlots: d.timeSlots ?? [],
  }));

  return {
    id: e.id,
    mediaReferences,
    legacyId: e.legacyId,
    slug: e.slug,
    title: e.title,
    description: e.description ?? "",
    category: e.category ?? "Other",
    eventType: e.eventType,
    eventPrivacy: e.eventPrivacy ?? "public",
    durationEn: e.durationEn ?? "",
    durationLo: e.durationLo ?? "",
    cancellationPolicy: e.cancellationPolicy ?? "",
    attendeeMessage: e.attendeeMessage ?? "",
    status: e.status,

    dateType: e.dateType,
    date: day(e.startDate) ?? "",
    time: e.startTime,
    endDate: day(e.endDate) ?? "",
    endTime: e.endTime,
    flexibleDateDesc: e.flexibleDateDesc,
    availableDates,
    hasTimeSelection: availableDates.some((d: FeEvent) => !!d.startTime),
    timeSlots: Array.from(new Set(availableDates.flatMap((d: FeEvent) => d.timeSlots))),
    bookingAvailableDays: e.dateType === "booking" ? availableDates.map((d: FeEvent) => d.date) : [],
    bookingTimeSlots:
      e.dateType === "booking" ? Array.from(new Set(availableDates.flatMap((d: FeEvent) => d.timeSlots))) : [],
    bookingSlotCapacities:
      e.dateType === "booking"
        ? (e.bookingSlotCapacities ?? e.privateDetails?.bookingSlotCapacities ?? Object.fromEntries((e.dates ?? []).map((d: BackendEvent) => [d.date, d.capacity ?? 0])))
        : {},
    attendeeQuestions: e.attendeeQuestions ?? e.privateDetails?.attendeeQuestions ?? [],
    bankName: e.privateDetails?.bankName ?? "",
    accountNumber: e.privateDetails?.accountNumber ?? "",
    accountHolder: e.privateDetails?.accountHolder ?? "",
    onlinePlatform: e.privateDetails?.onlinePlatform ?? "",
    onlineMeetingUrl: e.privateDetails?.onlineMeetingUrl ?? "",
    onlinePasscode: e.privateDetails?.onlinePasscode ?? "",
    onlineInstructions: e.privateDetails?.onlineInstructions ?? "",
    organizerSocialLinks: e.privateDetails?.organizerSocialLinks ?? {},

    venue: e.venueName ?? "",
    location: e.addressText ?? "",
    province: e.province,
    district: e.district,
    latitude: e.latitude ?? undefined,
    longitude: e.longitude ?? undefined,
    googleMapUrl: e.googleMapUrl,

    image: e.coverImageUrlDisplay ?? e.coverImageUrl ?? "",
    exampleImages: e.galleryUrlsDisplay ?? e.galleryUrls ?? [],
    languages: e.languages ?? ["Lao", "English"],

    hasSeating: !!e.hasSeating,
    zoneImage: e.zoneImageUrlDisplay ?? e.zoneImageUrl,
    allowReviews: e.allowReviews !== false,
    allowRefunds: !!e.allowRefunds,
    showRemainingTickets: e.showRemainingTickets !== false,
    enableCountdown: !!e.enableCountdown,
    requireEveryTicketInfo: !!e.requireEveryTicketInfo,
    maxTickets: e.maxTicketsPerOrder == null ? "unlimited" : String(e.maxTicketsPerOrder),

    organizer: e.organizer?.name,
    organizerInfo: e.organizer?.description,
    organizerEmail: e.organizer?.contactEmail,
    organizerPhone: e.organizer?.contactPhone,
    organizerContact: e.organizer?.contactPhone,
    organizerLogo: e.organizer?.logoUrlDisplay ?? e.organizer?.logoUrl,
    organizerId: e.organizerId,

    ticketTiers: (e.tiers ?? []).map((t: BackendEvent, index: number) => ({
      id: t.id,
      name: t.name,
      price: t.priceKip,
      available: t.quantityTotal == null ? Infinity : Math.max(t.quantityTotal - t.quantitySold, 0),
      quantity: t.quantityTotal == null ? "unlimited" : String(t.quantityTotal),
      description: t.description ?? `${t.name} Access`,
      sold: t.quantitySold ?? 0,
      ...((e.ticketSaleWindows ?? e.privateDetails?.ticketSaleWindows)?.[index] ?? {}),
    })),
    coupons: (e.coupons ?? []).map((c: BackendEvent) => ({
      id: c.id,
      code: c.code,
      type: c.discountType === "fixed" ? "fixed" : "percentage",
      discount: c.discountValue,
      isActive: c.isActive,
      maxUses: c.maxRedemptions ?? "",
      maxUsesPerUser: c.maxUsesPerUser ?? "",
      maxDiscountAmount: c.maxDiscountAmount ?? "",
      validFrom: c.startsAt ? new Date(new Date(c.startsAt).getTime() + 7 * 60 * 60_000).toISOString().slice(0, 10) : "",
      validUntil: c.expiresAt ? new Date(new Date(c.expiresAt).getTime() + 7 * 60 * 60_000).toISOString().slice(0, 10) : "",
    })),

    createdAt: e.createdAt,
    views: e.viewsCount ?? 0,
  };
}
