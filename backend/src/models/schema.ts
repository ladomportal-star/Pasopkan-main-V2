import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/* ============================================================================
 *  Enums
 * ========================================================================== */

export const userRole = pgEnum("user_role", ["user", "organizer", "admin"]);
export const eventCategory = pgEnum("event_category", [
  "Sports",
  "Workshop",
  "Festival",
  "Voucher",
  "Other",
]);
export const eventStatus = pgEnum("event_status", [
  "draft",
  "published",
  "sold_out",
  "cancelled",
  "completed",
]);
export const eventDateType = pgEnum("event_date_type", ["fixed", "flexible", "booking"]);
export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "confirmed",
  "cancelled",
  "refunded",
]);
export const ticketStatus = pgEnum("ticket_status", ["valid", "checked_in", "void", "refunded"]);
export const discountType = pgEnum("discount_type", ["percent", "fixed"]);
export const paymentState = pgEnum("payment_state", ["pending", "completed", "failed"]);
export const notificationType = pgEnum("notification_type", [
  "upcomingEvent",
  "ticket",
  "promo",
  "verified",
  "system",
  "noted",
]);

/* ============================================================================
 *  Identity
 * ========================================================================== */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firebaseUid: text("firebase_uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  displayName: text("display_name"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizers = pgTable("organizers", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerFirebaseUid: text("owner_firebase_uid"),
  name: text("name").notNull(),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================================
 *  Catalog  (events + their tiers / zones / dates / coupons)
 * ========================================================================== */

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizerId: uuid("organizer_id").references(() => organizers.id, { onDelete: "set null" }),
    // Maps to the id used by the current frontend catalog (frontend/data/events.ts)
    // during the transition period. Safe to drop once the catalog is fully in DB.
    legacyId: text("legacy_id").unique(),
    slug: text("slug").unique(),
    title: text("title").notNull(),
    description: text("description"),
    category: eventCategory("category"),
    eventType: text("event_type"),
    status: eventStatus("status").notNull().default("draft"),

    dateType: eventDateType("date_type").notNull().default("fixed"),
    startDate: date("start_date"),
    startTime: text("start_time"),
    endDate: date("end_date"),
    endTime: text("end_time"),
    flexibleDateDesc: text("flexible_date_desc"),
    timezone: text("timezone").notNull().default("Asia/Vientiane"),

    venueName: text("venue_name"),
    addressText: text("address_text"),
    province: text("province"),
    district: text("district"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    googleMapUrl: text("google_map_url"),

    coverImageUrl: text("cover_image_url"),
    galleryUrls: jsonb("gallery_urls").$type<string[]>(),
    languages: jsonb("languages").$type<string[]>(),

    hasSeating: boolean("has_seating").notNull().default(false),
    zoneImageUrl: text("zone_image_url"),
    allowReviews: boolean("allow_reviews").notNull().default(true),
    allowRefunds: boolean("allow_refunds").notNull().default(false),
    showRemainingTickets: boolean("show_remaining_tickets").notNull().default(true),
    enableCountdown: boolean("enable_countdown").notNull().default(false),
    requireEveryTicketInfo: boolean("require_every_ticket_info").notNull().default(false),
    maxTicketsPerOrder: integer("max_tickets_per_order"),

    viewsCount: integer("views_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_status_idx").on(t.status), index("events_organizer_idx").on(t.organizerId)],
);

export const eventDates = pgTable(
  "event_dates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    timeSlots: jsonb("time_slots").$type<string[]>(),
    capacity: integer("capacity"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("event_dates_event_idx").on(t.eventId)],
);

export const ticketTiers = pgTable(
  "ticket_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    priceKip: integer("price_kip").notNull().default(0), // LAK has no minor unit
    currency: text("currency").notNull().default("LAK"),
    quantityTotal: integer("quantity_total"), // null = unlimited
    quantitySold: integer("quantity_sold").notNull().default(0),
    perOrderLimit: integer("per_order_limit"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_tiers_event_idx").on(t.eventId)],
);

export const ticketZones = pgTable(
  "ticket_zones",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceKip: integer("price_kip").notNull().default(0),
    capacity: integer("capacity").notNull().default(0),
    sold: integer("sold").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_zones_event_idx").on(t.eventId)],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: discountType("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(), // percent (0-100) or kip amount
    maxRedemptions: integer("max_redemptions"),
    redeemedCount: integer("redeemed_count").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("coupons_event_code_uq").on(t.eventId, t.code)],
);

/* ============================================================================
 *  Commerce  (orders -> order_items -> check_ins)
 * ========================================================================== */

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    buyerFirebaseUid: text("buyer_firebase_uid").notNull(),

    // Loose reference to the event. Holds events.id / events.legacyId / slug
    // until the catalog fully lives in Postgres. Kept as text on purpose.
    eventId: text("event_id").notNull(),
    eventTitle: text("event_title").notNull(),

    status: orderStatus("status").notNull().default("pending"),
    subtotalKip: integer("subtotal_kip").notNull().default(0),
    discountKip: integer("discount_kip").notNull().default(0),
    totalKip: integer("total_kip").notNull().default(0),
    currency: text("currency").notNull().default("LAK"),
    couponCode: text("coupon_code"),

    selectedDate: text("selected_date"),
    selectedTime: text("selected_time"),

    paymentProvider: text("payment_provider"),
    paymentTxnId: text("payment_txn_id"),
    paymentStatus: text("payment_status"),

    buyerName: text("buyer_name"),
    buyerEmail: text("buyer_email"),
    buyerPhone: text("buyer_phone"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [
    index("orders_buyer_idx").on(t.buyerFirebaseUid),
    index("orders_event_idx").on(t.eventId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    // Loose tier reference + denormalized snapshot (price/name at purchase time)
    tierId: text("tier_id").notNull(),
    tierName: text("tier_name").notNull(),
    zoneName: text("zone_name"),
    unitPriceKip: integer("unit_price_kip").notNull().default(0),
    seatLabel: text("seat_label"),

    ticketCode: text("ticket_code").notNull().unique(), // QR payload
    status: ticketStatus("status").notNull().default("valid"),

    attendeeName: text("attendee_name"),
    attendeeEmail: text("attendee_email"),
    attendeePhone: text("attendee_phone"),
    customAnswers: jsonb("custom_answers").$type<Record<string, string | string[]>>(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Linked to an order item when the ticket exists in Postgres; null while
    // tickets still live only in Firestore.
    orderItemId: uuid("order_item_id")
      .unique()
      .references(() => orderItems.id, { onDelete: "cascade" }),
    // The scanned QR payload — always present, unique (one check-in per ticket).
    ticketCode: text("ticket_code").notNull().unique(),
    eventId: text("event_id").notNull(),
    attendeeName: text("attendee_name"),
    ticketType: text("ticket_type"),
    seatLabel: text("seat_label"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }).notNull().defaultNow(),
    checkedInBy: text("checked_in_by"), // staff label / uid
    gate: text("gate"),
    note: text("note"),
  },
  (t) => [index("check_ins_event_idx").on(t.eventId)],
);

/* ============================================================================
 *  Payments  (persisted gateway webhook state)
 * ========================================================================== */

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    transactionId: text("transaction_id").notNull().unique(),
    provider: text("provider"),
    state: paymentState("state").notNull().default("pending"),
    rawStatus: text("raw_status"),
    amountKip: integer("amount_kip"),
    payload: jsonb("payload"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

/* ============================================================================
 *  Reviews
 * ========================================================================== */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: text("event_id").notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorFirebaseUid: text("author_firebase_uid").notNull(),
    userName: text("user_name").notNull(),
    userRealName: text("user_real_name"),
    rating: integer("rating").notNull(), // 1..5
    comment: text("comment").notNull(),
    reviewDate: text("review_date").notNull(), // YYYY-MM-DD
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_event_idx").on(t.eventId),
    unique("reviews_event_author_uq").on(t.eventId, t.authorFirebaseUid),
  ],
);

/* ============================================================================
 *  Notifications  (per-user inbox; `read_at` null = unread)
 * ========================================================================== */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Identity-provider user id of the recipient (same value as users.firebase_uid).
    userUid: text("user_uid").notNull(),
    type: notificationType("type").notNull().default("system"),
    title: text("title").notNull(),
    titleLo: text("title_lo"),
    message: text("message").notNull(),
    messageLo: text("message_lo"),
    // Optional deep-link context, e.g. { eventId, orderId }
    data: jsonb("data").$type<Record<string, string>>(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_created_idx").on(t.userUid, t.createdAt)],
);

/* ============================================================================
 *  Relations (Drizzle query API)
 * ========================================================================== */

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  reviews: many(reviews),
}));

export const organizersRelations = relations(organizers, ({ many }) => ({
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organizer: one(organizers, { fields: [events.organizerId], references: [organizers.id] }),
  dates: many(eventDates),
  tiers: many(ticketTiers),
  zones: many(ticketZones),
  coupons: many(coupons),
}));

export const eventDatesRelations = relations(eventDates, ({ one }) => ({
  event: one(events, { fields: [eventDates.eventId], references: [events.id] }),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one }) => ({
  event: one(events, { fields: [ticketTiers.eventId], references: [events.id] }),
}));

export const ticketZonesRelations = relations(ticketZones, ({ one }) => ({
  event: one(events, { fields: [ticketZones.eventId], references: [events.id] }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  event: one(events, { fields: [coupons.eventId], references: [events.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  checkIn: one(checkIns, { fields: [orderItems.id], references: [checkIns.orderItemId] }),
}));

export const checkInsRelations = relations(checkIns, ({ one }) => ({
  orderItem: one(orderItems, { fields: [checkIns.orderItemId], references: [orderItems.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));
