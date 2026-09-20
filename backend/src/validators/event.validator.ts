import { z } from "zod";

const tier = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceKip: z.coerce.number().int().nonnegative().default(0),
  quantityTotal: z.coerce.number().int().positive().nullish(),
  perOrderLimit: z.coerce.number().int().positive().nullish(),
  sortOrder: z.coerce.number().int().default(0),
});

const zone = z.object({
  name: z.string().min(1),
  priceKip: z.coerce.number().int().nonnegative().default(0),
  capacity: z.coerce.number().int().nonnegative().default(0),
});

const eventDate = z.object({
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeSlots: z.array(z.string()).optional(),
  capacity: z.coerce.number().int().positive().nullish(),
});

const coupon = z.object({
  code: z.string().min(1),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.coerce.number().int().nonnegative(),
  maxRedemptions: z.coerce.number().int().positive().nullish(),
});

/** Everything the CreateEvent form can send. Unknown keys are stripped. */
export const createEventBody = z.object({
  legacyId: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["Sports", "Workshop", "Festival", "Voucher", "Other"]).optional(),
  eventType: z.string().optional(),
  status: z.enum(["draft", "published", "sold_out", "cancelled", "completed"]).default("draft"),

  dateType: z.enum(["fixed", "flexible", "booking"]).default("fixed"),
  startDate: z.string().nullish(),
  startTime: z.string().nullish(),
  endDate: z.string().nullish(),
  endTime: z.string().nullish(),
  flexibleDateDesc: z.string().nullish(),
  timezone: z.string().default("Asia/Vientiane"),

  venueName: z.string().nullish(),
  addressText: z.string().nullish(),
  province: z.string().nullish(),
  district: z.string().nullish(),
  latitude: z.coerce.number().nullish(),
  longitude: z.coerce.number().nullish(),
  googleMapUrl: z.string().nullish(),

  coverImageUrl: z.string().nullish(),
  galleryUrls: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),

  hasSeating: z.coerce.boolean().default(false),
  zoneImageUrl: z.string().nullish(),
  allowReviews: z.coerce.boolean().default(true),
  allowRefunds: z.coerce.boolean().default(false),
  showRemainingTickets: z.coerce.boolean().default(true),
  enableCountdown: z.coerce.boolean().default(false),
  requireEveryTicketInfo: z.coerce.boolean().default(false),
  maxTicketsPerOrder: z.coerce.number().int().positive().nullish(),

  organizer: z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      contactEmail: z.string().email().optional(),
      contactPhone: z.string().optional(),
      logoUrl: z.string().optional(),
    })
    .optional(),

  tiers: z.array(tier).default([]),
  zones: z.array(zone).default([]),
  dates: z.array(eventDate).default([]),
  coupons: z.array(coupon).default([]),
});

// Partial for PATCH-style updates. The child arrays drop their `.default([])`
// so "not sent" stays undefined and never wipes existing tiers/zones/etc.
export const updateEventBody = createEventBody.partial().extend({
  tiers: z.array(tier).optional(),
  zones: z.array(zone).optional(),
  dates: z.array(eventDate).optional(),
  coupons: z.array(coupon).optional(),
});

export const eventIdParam = z.object({ id: z.string().min(1) });

export const listEventsQuery = z.object({
  status: z.enum(["draft", "published", "sold_out", "cancelled", "completed"]).optional(),
  mine: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateEventBody = z.infer<typeof createEventBody>;
export type UpdateEventBody = z.infer<typeof updateEventBody>;
