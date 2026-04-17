-- Add 'basico' and 'pro' to tenant_plan enum
-- These represent: basico = R$399 setup + 30d trial, pro = R$499 setup + 90d trial
-- Keeping 'starter' for backward compatibility with existing redeemed CDKeys

ALTER TYPE "tenant_plan" ADD VALUE IF NOT EXISTS 'basico' AFTER 'free';--> statement-breakpoint
ALTER TYPE "tenant_plan" ADD VALUE IF NOT EXISTS 'pro' AFTER 'basico';--> statement-breakpoint

-- Migrate existing 'starter' CDKeys and tenants to 'basico'
-- (starter was the old default for 30-day trials)
UPDATE "tenants" SET "plan" = 'basico' WHERE "plan" = 'starter';--> statement-breakpoint
UPDATE "cdkeys" SET "plan" = 'basico' WHERE "plan" = 'starter';
