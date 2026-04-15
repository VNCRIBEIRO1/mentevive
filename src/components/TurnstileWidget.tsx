"use client";

import Script from "next/script";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function TurnstileWidget() {
  if (!siteKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme="light"
        data-language="pt-BR"
        data-response-field-name="turnstileToken"
      />
      <p className="text-[0.65rem] text-txt-muted">
        Proteção anti-spam habilitada via Cloudflare Turnstile.
      </p>
    </div>
  );
}
