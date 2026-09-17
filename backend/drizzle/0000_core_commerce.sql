CREATE TYPE "public"."discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('Sports', 'Workshop', 'Festival', 'Voucher', 'Other');--> statement-breakpoint
CREATE TYPE "public"."event_date_type" AS ENUM('fixed', 'flexible', 'booking');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'sold_out', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'confirmed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('valid', 'checked_in', 'void', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'organizer', 'admin');--> statement-breakpoint
CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_item_id" uuid NOT NULL,
	"event_id" text NOT NULL,
	"checked_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_by" text,
	"gate" text,
	"note" text,
	CONSTRAINT "check_ins_order_item_id_unique" UNIQUE("order_item_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" integer NOT NULL,
	"max_redemptions" integer,
	"redeemed_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_event_code_uq" UNIQUE("event_id","code")
);
--> statement-breakpoint
CREATE TABLE "event_dates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"date" date NOT NULL,
	"start_time" text,
	"end_time" text,
	"time_slots" jsonb,
	"capacity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" uuid,
	"legacy_id" text,
	"slug" text,
	"title" text NOT NULL,
	"description" text,
	"category" "event_category",
	"event_type" text,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"date_type" "event_date_type" DEFAULT 'fixed' NOT NULL,
	"start_date" date,
	"start_time" text,
	"end_date" date,
	"end_time" text,
	"flexible_date_desc" text,
	"timezone" text DEFAULT 'Asia/Vientiane' NOT NULL,
	"venue_name" text,
	"address_text" text,
	"province" text,
	"district" text,
	"latitude" double precision,
	"longitude" double precision,
	"google_map_url" text,
	"cover_image_url" text,
	"gallery_urls" jsonb,
	"languages" jsonb,
	"has_seating" boolean DEFAULT false NOT NULL,
	"zone_image_url" text,
	"allow_reviews" boolean DEFAULT true NOT NULL,
	"allow_refunds" boolean DEFAULT false NOT NULL,
	"show_remaining_tickets" boolean DEFAULT true NOT NULL,
	"enable_countdown" boolean DEFAULT false NOT NULL,
	"require_every_ticket_info" boolean DEFAULT false NOT NULL,
	"max_tickets_per_order" integer,
	"views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_legacy_id_unique" UNIQUE("legacy_id"),
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tier_id" text NOT NULL,
	"tier_name" text NOT NULL,
	"zone_name" text,
	"unit_price_kip" integer DEFAULT 0 NOT NULL,
	"seat_label" text,
	"ticket_code" text NOT NULL,
	"status" "ticket_status" DEFAULT 'valid' NOT NULL,
	"attendee_name" text,
	"attendee_email" text,
	"attendee_phone" text,
	"custom_answers" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_items_ticket_code_unique" UNIQUE("ticket_code")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid,
	"buyer_firebase_uid" text NOT NULL,
	"event_id" text NOT NULL,
	"event_title" text NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_kip" integer DEFAULT 0 NOT NULL,
	"discount_kip" integer DEFAULT 0 NOT NULL,
	"total_kip" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"coupon_code" text,
	"selected_date" text,
	"selected_time" text,
	"payment_provider" text,
	"payment_txn_id" text,
	"payment_status" text,
	"buyer_name" text,
	"buyer_email" text,
	"buyer_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "organizers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_firebase_uid" text,
	"name" text NOT NULL,
	"description" text,
	"contact_email" text,
	"contact_phone" text,
	"logo_url" text,
	"social_links" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"user_id" uuid,
	"author_firebase_uid" text NOT NULL,
	"user_name" text NOT NULL,
	"user_real_name" text,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"review_date" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_event_author_uq" UNIQUE("event_id","author_firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "ticket_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price_kip" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'LAK' NOT NULL,
	"quantity_total" integer,
	"quantity_sold" integer DEFAULT 0 NOT NULL,
	"per_order_limit" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_zones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_kip" integer DEFAULT 0 NOT NULL,
	"capacity" integer DEFAULT 0 NOT NULL,
	"sold" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"firebase_uid" text NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"phone" text,
	"avatar_url" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_organizers_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_zones" ADD CONSTRAINT "ticket_zones_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_dates_event_idx" ON "event_dates" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_organizer_idx" ON "events" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" USING btree ("buyer_firebase_uid");--> statement-breakpoint
CREATE INDEX "orders_event_idx" ON "orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reviews_event_idx" ON "reviews" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ticket_tiers_event_idx" ON "ticket_tiers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "ticket_zones_event_idx" ON "ticket_zones" USING btree ("event_id");