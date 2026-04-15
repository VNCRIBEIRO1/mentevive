import { NextRequest, NextResponse } from "next/server";
import { contactSchema, formatZodError } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { getPublicTenantId } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`contact:${ip}`, 3, 10 * 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos antes de enviar nova mensagem." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { name, email, subject, message, turnstileToken } = parsed.data;

    const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
    if (!captchaOk) {
      return NextResponse.json(
        { error: "Confirmação anti-spam inválida. Tente novamente." },
        { status: 400 }
      );
    }

    const tenant = await getPublicTenantId(req);
    if (tenant.error || !tenant.tenantId) {
      return NextResponse.json({ error: tenant.error || "Missing tenant" }, { status: 400 });
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

    return NextResponse.json({ message: "Mensagem recebida com sucesso!" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem." }, { status: 500 });
  }
}
