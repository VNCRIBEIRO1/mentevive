CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete');--> statement-breakpoint
CREATE TABLE "cdkeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"plan" "tenant_plan" DEFAULT 'starter' NOT NULL,
	"duration_days" integer DEFAULT 30 NOT NULL,
	"tenant_id" uuid,
	"redeemed_at" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cdkeys_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_subscription_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "subscription_status" "subscription_status";--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "cdkeys" ADD CONSTRAINT "cdkeys_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cdkeys" ADD CONSTRAINT "cdkeys_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cdkeys_code" ON "cdkeys" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_cdkeys_tenant" ON "cdkeys" USING btree ("tenant_id");