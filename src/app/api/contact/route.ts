import { NextRequest, NextResponse } from "next/server";
import { contactSchema, formatZodError } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getPublicTenantId } from "@/lib/tenant";

/** Allowed landing-page origins for cross-origin contact form submissions. */
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_LANDING_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean)
);

function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  return {};
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = corsHeaders(req);
  const json = (body: Record<string, unknown>, opts: { status: number }) =>
    NextResponse.json(body, { ...opts, headers: cors });
  try {
    const ip = getClientIp(req);
    const rl = await rateLimit(`contact:${ip}`, 3, 10 * 60_000);
    if (!rl.success) {
      return json(
        { error: "Muitas tentativas. Aguarde alguns minutos antes de enviar nova mensagem." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { name, email, subject, message, turnstileToken } = parsed.data;

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return json(
        { error: "Confirmação anti-spam inválida. Tente novamente." },
        { status: 400 }
      );
    }

    const tenant = await getPublicTenantId(req);
    if (tenant.error || !tenant.tenantId) {
      return json({ error: tenant.error || "Missing tenant" }, { status: 400 });
    }

    // Persist contact submission as admin notification (visible in NotificationBell)
    await createNotification({
      tenantId: tenant.tenantId,
      type: "registration", // reuse existing type for contact messages
      title: `📬 Contato: ${subject}`,
      message: `De: ${name} (${email})\n${message}`,
      icon: "📬",
      linkUrl: "/admin/configuracoes",
    });

    console.log("📬 Novo contato salvo:", { name, email, subject, timestamp: new Date().toISOString() });

    return json({ message: "Mensagem recebida com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
