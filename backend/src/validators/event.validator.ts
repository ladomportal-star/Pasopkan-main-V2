import { z } from "zod";

const tier = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceKip: z.coerce.number().int().nonnegative().default(0),
  quantityTotal: z.coerce.number().int().nonnegative().max(2147483647).nullish(),
  perOrderLimit: z.coerce.number().int().positive().nullish(),
  sortOrder: z.coerce.number().int().default(0),
});

const eventDate = z.object({
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timeSlots: z.array(z.string()).optional(),
  capacity: z.coerce.number().int().positive().nullish(),
});

const coupon = z
  .object({
    code: z.string().trim().min(1).max(100),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.coerce.number().int().nonnegative(),
    maxRedemptions: z.coerce.number().int().positive().nullish(),
    maxUsesPerUser: z.coerce.number().int().positive().nullish(),
    maxDiscountAmount: z.coerce.number().int().positive().max(2147483647).nullish(),
    startsAt: z.string().datetime().nullish(),
    expiresAt: z.string().datetime().nullish(),
    isActive: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "percent" && value.discountValue > 100)
      ctx.addIssue({
        code: "custom",
        path: ["discountValue"],
        message: "Percentage must not exceed 100",
      });
    if (value.startsAt && value.expiresAt && value.startsAt > value.expiresAt)
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Coupon expiry must follow its start",
      });
  });

const coupons = z
  .array(coupon)
  .max(100)
  .refine(
    (values) => new Set(values.map((c) => c.code.toUpperCase())).size === values.length,
    "Coupon codes must be unique within an event",
  );

const question = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  label: z.string().trim().max(500),
  type: z.enum([
    "text",
    "long_text",
    "url",
    "checkbox",
    "single_choice",
    "multi_choice",
    "options",
  ]),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
});
export const attendeeQuestionsSchema = z
  .array(question)
  .max(50)
  .transform((values) => values.map((q, i) => ({ ...q, id: q.id ?? `question-${i + 1}` })))
  .refine(
    (values) => new Set(values.map((q) => q.id)).size === values.length,
    "Question IDs must be unique",
  );

/** Everything the CreateEvent form can send. Unknown keys are stripped. */
export const createEventBody = z.object({
  legacyId: z.string().optional(),
  slug: z.string().optional(),
  title: z.string().min(1),
  rejectionReason: z.string().trim().min(1).max(2000).optional(),
  description: z.string().optional(),
  category: z.enum(["Sports", "Workshop", "Festival", "Voucher", "Other"]).optional(),
  eventType: z.string().optional(),
  eventPrivacy: z.enum(["public", "private"]).default("public"),
  durationEn: z.string().max(500).nullish(),
  durationLo: z.string().max(500).nullish(),
  cancellationPolicy: z.string().max(10000).nullish(),
  attendeeMessage: z.string().max(10000).nullish(),
  status: z
    .enum([
      "draft",
      "pending_review",
      "rejected",
      "published",
      "sold_out",
      "cancelled",
      "completed",
    ])
    .default("draft"),
  termsAccepted: z.literal(true).optional(),
  submissionOtp: z
    .object({
      challengeId: z.string().uuid(),
      code: z.string().regex(/^\d{6}$/),
    })
    .optional(),

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
      contactEmail: z.string().email().nullish(),
      contactPhone: z.string().nullish(),
      logoUrl: z.string().nullish(),
    })
    .optional(),

  privateDetails: z
    .object({
      bankName: z.string().max(200).nullish(),
      accountNumber: z.string().max(100).nullish(),
      accountHolder: z.string().max(200).nullish(),
      onlinePlatform: z.string().max(100).nullish(),
      onlineMeetingUrl: z.string().max(2000).nullish(),
      onlinePasscode: z.string().max(200).nullish(),
      onlineInstructions: z.string().max(10000).nullish(),
      bookingSlotCapacities: z.record(z.string(), z.coerce.number().int().nonnegative()).nullish(),
      attendeeQuestions: attendeeQuestionsSchema.nullish(),
      ticketSaleWindows: z.array(z.record(z.string(), z.unknown())).max(100).nullish(),
      organizerSocialLinks: z.record(z.string(), z.string().max(2000)).nullish(),
    })
    .optional(),

  tiers: z.array(tier).default([]),
  dates: z.array(eventDate).default([]),
  coupons: coupons.default([]),
});

// Partial for PATCH-style updates. The child arrays drop their `.default([])`
// so "not sent" stays undefined and never wipes existing tiers/dates/etc.
export const updateEventBody = createEventBody.partial().extend({
  eventPrivacy: z.enum(["public", "private"]).optional(),
  status: z
    .enum([
      "draft",
      "pending_review",
      "rejected",
      "published",
      "sold_out",
      "cancelled",
      "completed",
    ])
    .optional(),
  dateType: z.enum(["fixed", "flexible", "booking"]).optional(),
  timezone: z.string().optional(),
  hasSeating: z.coerce.boolean().optional(),
  allowReviews: z.coerce.boolean().optional(),
  allowRefunds: z.coerce.boolean().optional(),
  showRemainingTickets: z.coerce.boolean().optional(),
  enableCountdown: z.coerce.boolean().optional(),
  requireEveryTicketInfo: z.coerce.boolean().optional(),
  tiers: z.array(tier).optional(),
  dates: z.array(eventDate).optional(),
  coupons: coupons.optional(),
});

export const eventIdParam = z.object({ id: z.string().min(1) });

export const listEventsQuery = z.object({
  status: z
    .enum([
      "draft",
      "pending_review",
      "rejected",
      "published",
      "sold_out",
      "cancelled",
      "completed",
    ])
    .optional(),
  mine: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateEventBody = z.infer<typeof createEventBody>;
export type UpdateEventBody = z.infer<typeof updateEventBody>;
