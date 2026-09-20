CREATE TYPE "public"."payment_state" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"transaction_id" text NOT NULL,
	"provider" text,
	"state" "payment_state" DEFAULT 'pending' NOT NULL,
	"raw_status" text,
	"amount_kip" integer,
	"payload" jsonb,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
ALTER TABLE "check_ins" ALTER COLUMN "order_item_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "ticket_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "attendee_name" text;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "ticket_type" text;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "seat_label" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "check_ins_event_idx" ON "check_ins" USING btree ("event_id");--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_ticket_code_unique" UNIQUE("ticket_code");