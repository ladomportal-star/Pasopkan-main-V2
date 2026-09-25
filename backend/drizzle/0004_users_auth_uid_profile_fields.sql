-- The `users` table is empty in every environment this has shipped to, so
-- this rebuilds the identity/profile columns outright rather than migrating
-- data: firebase_uid -> auth_uid (naming left over from the pre-Supabase
-- auth system), display_name split into first_name/last_name, and gender /
-- date_of_birth added (previously collected by the frontend but nowhere to
-- store them).
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_firebase_uid_unique";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "firebase_uid" TO "auth_uid";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_auth_uid_unique" UNIQUE("auth_uid");
