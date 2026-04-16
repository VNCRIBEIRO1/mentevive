import { z } from "zod";

/**
 * Runtime environment variable validation with Zod.
 * Required vars throw on missing; optional vars degrade gracefully.
 */
const envSchema = z
  .object({
    // Required
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    NEXTAUTH_SECRET: z.string().min(1).optional(),
    AUTH_SECRET: z.string().min(1).optional(),
    NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),

    // Stripe (optional - graceful degradation)
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_PRICE_MONTHLY: z.string().optional(),
    STRIPE_PRICE_ANNUAL: z.string().optional(),

    // Vercel Cron (optional)
    CRON_SECRET: z.string().optional(),

    // One-time bootstrap (optional)
    SETUP_SECRET: z.string().optional(),

    // Cloudflare Turnstile (optional)
    TURNSTILE_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.NEXTAUTH_SECRET && !data.AUTH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["NEXTAUTH_SECRET"],
        message: "NEXTAUTH_SECRET or AUTH_SECRET is required",
      });
    }
  });

export type Env = z.infer<typeof envSchema> & { NEXTAUTH_SECRET: string };

let _env: Env | null = null;

/**
 * Parse and cache validated env vars.
 * Call `getEnv()` instead of accessing `process.env` directly.
 * Throws at runtime if required vars are missing.
 */
export function getEnv(): Env {
  if (_env) return _env;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }

  _env = {
    ...parsed.data,
    NEXTAUTH_SECRET: parsed.data.NEXTAUTH_SECRET ?? parsed.data.AUTH_SECRET!,
  };
  return _env;
}

/** Check if Stripe is configured (secret key is set). */
export function isStripeConfigured(): boolean {
  try {
    const env = getEnv();
    return !!env.STRIPE_SECRET_KEY;
  } catch {
    return false;
  }
}
