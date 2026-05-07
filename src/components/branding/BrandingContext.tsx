"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { ResolvedBranding } from "@/lib/branding";

const PLATFORM_FALLBACK: ResolvedBranding = {
  displayName: "MenteVive",
  logoUrl: null,
  primaryColor: "#5B9BD5",
  accentColor: "#6ECFF6",
  tagline: null,
  consentMarkdown: null,
};

const BrandingContext = createContext<ResolvedBranding>(PLATFORM_FALLBACK);

/**
 * Provides the active tenant's branding to descendant client components.
 * Fetches once on mount and applies CSS variables to <html> for global use
 * (e.g. `style={{ background: "var(--tenant-primary)" }}`).
 *
 * Wrap inside an authenticated layout (admin or portal) — uses session-derived tenantId.
 */
export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<ResolvedBranding>(PLATFORM_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tenant/branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.branding) return;
        setBranding(data.branding);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--tenant-primary", branding.primaryColor);
    root.style.setProperty("--tenant-accent", branding.accentColor);
  }, [branding.primaryColor, branding.accentColor]);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding(): ResolvedBranding {
  return useContext(BrandingContext);
}

export function brandingInitial(branding: ResolvedBranding): string {
  const trimmed = branding.displayName.trim();
  return trimmed ? trimmed[0].toUpperCase() : "Ψ";
}
