import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Define the 'users' table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'tickets' table for purchased bookings
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  eventId: text('event_id').notNull(),
  eventTitle: text('event_title').notNull(),
  tierId: text('tier_id').notNull(),
  tierName: text('tier_name').notNull(),
  price: integer('price').notNull(),
  quantity: integer('quantity').notNull(),
  selectedDate: text('selected_date'),
  selectedTime: text('selected_time'),
  status: text('status').notNull().default('confirmed'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define the 'reviews' table for user-submitted event feedback
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  eventId: text('event_id').notNull(),
  userId: text('user_id')
    .references(() => users.uid)
    .notNull(),
  userName: text('user_name').notNull(),
  userRealName: text('user_real_name'),
  rating: integer('rating').notNull(), // 1 to 5
  comment: text('comment').notNull(), // text comment or serialized JSON
  date: text('date').notNull(), // YYYY-MM-DD
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  reviews: many(reviews),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.uid],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.uid],
  }),
}));
