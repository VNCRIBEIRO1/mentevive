import "server-only";
import { Resend } from "resend";

/**
 * Transactional email sender backed by Resend.
 *
 * In production, set RESEND_API_KEY and EMAIL_FROM. Without those, the function
 * logs a warning and returns success — useful in dev so flows like password reset
 * don't crash, but prod ops should monitor for "no email provider configured" warnings.
 */

const isConfigured = !!process.env.RESEND_API_KEY;
const resend = isConfigured ? new Resend(process.env.RESEND_API_KEY!) : null;

const DEFAULT_FROM = process.env.EMAIL_FROM || "MenteVive <onboarding@mentevive.app>";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  /** Plaintext fallback. If omitted, Resend will derive it from html. */
  text?: string;
};

export type SendEmailResult =
  | { ok: true; id: string | null; provider: "resend" | "noop" }
  | { ok: false; error: string };

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  if (!resend) {
    console.warn(
      `[email] Skipping send to ${params.to}: RESEND_API_KEY not set. Subject="${params.subject}".`,
    );
    return { ok: true, id: null, provider: "noop" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || DEFAULT_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
    });

    if (error) {
      console.error(`[email] Resend error sending to ${params.to}:`, error);
      return { ok: false, error: error.message };
    }
    return { ok: true, id: data?.id ?? null, provider: "resend" };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    console.error(`[email] Exception sending to ${params.to}:`, err);
    return { ok: false, error: msg };
  }
}

/** Minimal HTML wrapper for transactional emails — neutral, accessible, mobile-friendly. */
export function emailLayout(opts: { tenantName: string; primaryColor?: string; bodyHtml: string; footer?: string }): string {
  const accent = opts.primaryColor || "#D4A574";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(opts.tenantName)}</title>
</head>
<body style="margin:0;padding:0;background:#FFF5EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#3D2B1F;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#FFF5EE;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px -2px rgba(212,165,116,0.15);">
<tr><td style="padding:32px 32px 16px 32px;border-bottom:3px solid ${accent};">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#3D2B1F;">${escapeHtml(opts.tenantName)}</h1>
</td></tr>
<tr><td style="padding:24px 32px 32px 32px;font-size:15px;line-height:1.6;color:#3D2B1F;">
${opts.bodyHtml}
</td></tr>
<tr><td style="padding:16px 32px;background:#F9EDE3;border-top:1px solid #E8DFD3;font-size:12px;color:#7D6E62;text-align:center;">
${opts.footer ?? "Este e-mail foi enviado automaticamente pela plataforma MenteVive. Por favor, não responda."}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
