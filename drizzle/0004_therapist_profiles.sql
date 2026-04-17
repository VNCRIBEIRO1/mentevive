-- Add therapist profile fields for public directory
ALTER TABLE "users" ADD COLUMN "specialty" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "crp" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_visible" boolean DEFAULT false NOT NULL;
