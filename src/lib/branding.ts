import "server-only";
import { db } from "@/lib/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Tenant-level branding — read from the `tenants.branding` JSONB column.
 *
 * Each field is optional; missing fields fall back to platform defaults
 * (MenteVive). The platform footer always shows "Powered by MenteVive"
 * regardless of branding overrides.
 */
export type TenantBranding = {
  /** Display name shown in sidebar/header (e.g. "Consultório da Bia") */
  displayName?: string;
  /** Public URL of the logo image; if absent, the initial of displayName is used */
  logoUrl?: string;
  /** Primary accent color (CSS color string, e.g. "#D4A574") */
  primaryColor?: string;
  /** Secondary accent color */
  accentColor?: string;
  /** Tagline shown on patient portal landing */
  tagline?: string;
  /** Custom markdown for the consent form (optional override) */
  consentMarkdown?: string;
};

/**
 * Resolved branding with all fields filled — used by UI components.
 * `displayName` is always non-empty (falls back to tenant.name).
 */
export type ResolvedBranding = {
  displayName: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  tagline: string | null;
  consentMarkdown: string | null;
};

const PLATFORM_DEFAULTS: ResolvedBranding = {
  displayName: "MenteVive",
  logoUrl: null,
  primaryColor: "#5B9BD5",
  accentColor: "#6ECFF6",
  tagline: null,
  consentMarkdown: null,
};

/** Look up branding for a tenant; returns platform defaults if tenant lacks branding. */
export async function getTenantBranding(tenantId: string): Promise<ResolvedBranding> {
  const [row] = await db
    .select({
      name: tenants.name,
      branding: tenants.branding,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!row) return PLATFORM_DEFAULTS;

  const b = (row.branding ?? {}) as TenantBranding;

  return {
    displayName: b.displayName?.trim() || row.name || PLATFORM_DEFAULTS.displayName,
    logoUrl: b.logoUrl?.trim() || null,
    primaryColor: b.primaryColor?.trim() || PLATFORM_DEFAULTS.primaryColor,
    accentColor: b.accentColor?.trim() || PLATFORM_DEFAULTS.accentColor,
    tagline: b.tagline?.trim() || null,
    consentMarkdown: b.consentMarkdown?.trim() || null,
  };
}

/**
 * Render branding tokens as CSS custom properties.
 * Inject the result inside a <style>:root {…}</style> in the layout `<head>`.
 *
 * Components consume the variables directly (e.g. `style={{ background: "var(--tenant-primary)" }}`).
 */
export function brandingToCssVars(branding: ResolvedBranding): string {
  return [
    `--tenant-primary: ${escapeCssValue(branding.primaryColor)};`,
    `--tenant-accent: ${escapeCssValue(branding.accentColor)};`,
  ].join(" ");
}

/** Strip characters that could break out of a CSS value context. */
function escapeCssValue(value: string): string {
  return value.replace(/[^#a-zA-Z0-9.,()\s%-]/g, "");
}

/** Compute the initial letter shown when no logoUrl is set. */
export function brandingInitial(branding: ResolvedBranding): string {
  const trimmed = branding.displayName.trim();
  if (!trimmed) return "Ψ";
  return trimmed[0].toUpperCase();
}
