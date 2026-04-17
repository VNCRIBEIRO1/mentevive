"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type SubscriptionData = {
  plan: string;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  hasStripeCustomer: boolean;
  hasSubscription: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  basico: "Básico",
  pro: "Pro",
  starter: "Trial",
  professional: "Mensal",
  enterprise: "Anual",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: "Período de Teste", color: "text-blue-600 bg-blue-50 border-blue-200" },
  active: { label: "Ativo", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  past_due: { label: "Pagamento Pendente", color: "text-amber-600 bg-amber-50 border-amber-200" },
  canceled: { label: "Cancelado", color: "text-red-600 bg-red-50 border-red-200" },
  unpaid: { label: "Não Pago", color: "text-red-600 bg-red-50 border-red-200" },
  incomplete: { label: "Incompleto", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

export default function AssinaturaPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cdkeyCode, setCdkeyCode] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const status = searchParams.get("status");

  useEffect(() => {
    fetchSubscription();
  }, []);

  useEffect(() => {
    if (status === "success") {
      setToast({ msg: "Assinatura ativada com sucesso! 🎉", type: "success" });
      fetchSubscription();
    } else if (status === "cancelled") {
      setToast({ msg: "Checkout cancelado. Nenhuma cobrança foi feita.", type: "error" });
    }
  }, [status]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/admin/subscription");
      if (res.ok) setData(await res.json());
    } catch {}
    setLoading(false);
  }

  async function handleCheckout(plan: "professional" | "enterprise") {
    setActionLoading(plan);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (res.ok && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        setToast({ msg: json.error || "Erro ao iniciar checkout.", type: "error" });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", type: "error" });
    }
    setActionLoading(null);
  }

  async function handlePortal() {
    setActionLoading("portal");
    try {
      const res = await fetch("/api/admin/subscription/portal", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.portalUrl) {
        window.location.href = json.portalUrl;
      } else {
        setToast({ msg: json.error || "Erro ao abrir portal.", type: "error" });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", type: "error" });
    }
    setActionLoading(null);
  }

  async function handleCDKey() {
    if (!cdkeyCode.trim()) return;
    setActionLoading("cdkey");
    try {
      const res = await fetch("/api/admin/subscription/cdkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cdkeyCode }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setToast({ msg: `CDKey ativada! ${json.durationDays} dias de teste liberados.`, type: "success" });
        setCdkeyCode("");
        fetchSubscription();
      } else {
        setToast({ msg: json.error || "Código inválido.", type: "error" });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", type: "error" });
    }
    setActionLoading(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-primary/10 rounded-brand-sm w-48" />
        <div className="h-40 bg-primary/5 rounded-brand" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72 bg-primary/5 rounded-brand" />
          <div className="h-72 bg-primary/5 rounded-brand" />
        </div>
      </div>
    );
  }

  const plan = data?.plan || "free";
  const subStatus = data?.subscriptionStatus;
  const statusInfo = subStatus ? STATUS_LABELS[subStatus] : null;
  const isPaid = plan === "professional" || plan === "enterprise";
  const isTrialing = data?.isTrialActive;
  const isExpired = data?.isTrialExpired;
  const canUpgrade = plan === "free" || isExpired || (["basico", "pro", "starter"].includes(plan) && !data?.hasSubscription);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-brand-sm shadow-warm-lg border text-sm font-medium animate-in slide-in-from-right ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-txt">Assinatura</h1>
        <p className="text-sm text-txt-muted mt-1">Gerencie seu plano e assinatura da plataforma</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-txt-muted mb-1">Plano Atual</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-heading font-bold text-txt">
                {PLAN_LABELS[plan] || plan}
              </span>
              {statusInfo && (
                <span className={`text-xs px-2.5 py-1 rounded-brand-full border font-semibold ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            {isTrialing && data?.trialDaysRemaining != null && (
              <p className="text-sm text-blue-600 mt-2">
                ⏳ {data.trialDaysRemaining} dia{data.trialDaysRemaining !== 1 ? "s" : ""} restante{data.trialDaysRemaining !== 1 ? "s" : ""} de teste
              </p>
            )}
            {data?.currentPeriodEnd && isPaid && (
              <p className="text-sm text-txt-muted mt-2">
                Próxima renovação: {new Date(data.currentPeriodEnd).toLocaleDateString("pt-BR")}
              </p>
            )}
            {plan === "free" && !isTrialing && !isExpired && (
              <p className="text-sm text-txt-muted mt-2">
                Ative um código de teste ou escolha um plano para começar
              </p>
            )}
            {isExpired && (
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Seu período de teste expirou. Assine um plano para continuar usando o sistema.
              </p>
            )}
          </div>

          {data?.hasSubscription && (
            <button
              onClick={handlePortal}
              disabled={actionLoading === "portal"}
              className="px-5 py-2.5 rounded-brand-sm border-[1.5px] border-primary/20 text-sm font-semibold text-primary-dark hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              {actionLoading === "portal" ? "Abrindo…" : "Gerenciar Assinatura"}
            </button>
          )}
        </div>
      </div>

      {/* CDKey Section — only for free plan */}
      {plan === "free" && (
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h2 className="font-heading text-lg font-semibold text-txt mb-2">Código de Ativação (CDKey)</h2>
          <p className="text-sm text-txt-muted mb-4">
            Recebeu um código de ativação? Insira abaixo para liberar seu período de teste gratuito.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={cdkeyCode}
              onChange={(e) => setCdkeyCode(e.target.value.toUpperCase())}
              placeholder="Ex: A1B2C3D4E5F6G7H8"
              maxLength={32}
              className="flex-1 py-2.5 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-mono text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 tracking-wider"
            />
            <button
              onClick={handleCDKey}
              disabled={actionLoading === "cdkey" || !cdkeyCode.trim()}
              className="px-6 py-2.5 rounded-brand-sm bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-semibold shadow-warm-sm hover:shadow-warm-md transition-all disabled:opacity-50"
            >
              {actionLoading === "cdkey" ? "Ativando…" : "Ativar"}
            </button>
          </div>
        </div>
      )}

      {/* Plan Cards — show when can upgrade */}
      {canUpgrade && (
        <div>
          <h2 className="font-heading text-lg font-semibold text-txt mb-4">Escolha seu Plano</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly Plan */}
            <div className="bg-card rounded-brand p-6 shadow-sm border-[1.5px] border-primary/10 hover:border-primary/30 transition-colors relative overflow-hidden">
              <div className="mb-4">
                <h3 className="font-heading text-xl font-bold text-txt">Profissional</h3>
                <p className="text-sm text-txt-muted mt-1">Plano mensal com todos os recursos</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-heading font-bold text-txt">R$ 59</span>
                <span className="text-xl font-heading font-bold text-txt">,90</span>
                <span className="text-sm text-txt-muted"> /mês</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-txt-light">
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Pacientes ilimitados</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Agenda completa</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Prontuários eletrônicos</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Teleconsulta integrada</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Pagamentos via Stripe</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Blog integrado</li>
              </ul>
              <button
                onClick={() => handleCheckout("professional")}
                disabled={!!actionLoading}
                className="w-full py-3 rounded-brand-sm bg-gradient-to-r from-primary to-primary-dark text-white font-semibold shadow-warm-sm hover:shadow-warm-md transition-all disabled:opacity-50"
              >
                {actionLoading === "professional" ? "Processando…" : "Assinar Mensal"}
              </button>
            </div>

            {/* Annual Plan */}
            <div className="bg-card rounded-brand p-6 shadow-sm border-[2px] border-teal/30 hover:border-teal/50 transition-colors relative overflow-hidden">
              {/* Best value badge */}
              <div className="absolute top-4 right-4">
                <span className="text-xs px-3 py-1 rounded-brand-full bg-teal/10 text-teal font-bold border border-teal/20">
                  Economize 30%
                </span>
              </div>
              <div className="mb-4">
                <h3 className="font-heading text-xl font-bold text-txt">Empresarial</h3>
                <p className="text-sm text-txt-muted mt-1">Plano anual com melhor custo-benefício</p>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-heading font-bold text-txt">R$ 499</span>
                <span className="text-xl font-heading font-bold text-txt">,00</span>
                <span className="text-sm text-txt-muted"> /ano</span>
              </div>
              <p className="text-xs text-teal font-semibold mb-6">
                Equivale a R$ 41,58/mês — economize R$ 219,80
              </p>
              <ul className="space-y-2 mb-6 text-sm text-txt-light">
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Tudo do Profissional</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Prioridade no suporte</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Grupos terapêuticos</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Landing page personalizada</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Domínio personalizado</li>
                <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Relatórios avançados</li>
              </ul>
              <button
                onClick={() => handleCheckout("enterprise")}
                disabled={!!actionLoading}
                className="w-full py-3 rounded-brand-sm bg-gradient-to-r from-teal to-teal-dark text-white font-semibold shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {actionLoading === "enterprise" ? "Processando…" : "Assinar Anual"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Already subscribed info */}
      {isPaid && data?.hasSubscription && (
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <h2 className="font-heading text-lg font-semibold text-txt mb-2">Gerenciar Assinatura</h2>
          <p className="text-sm text-txt-muted mb-4">
            Altere seu plano, atualize forma de pagamento ou cancele pelo portal do Stripe.
          </p>
          <button
            onClick={handlePortal}
            disabled={actionLoading === "portal"}
            className="px-6 py-2.5 rounded-brand-sm border-[1.5px] border-primary/20 text-sm font-semibold text-primary-dark hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            {actionLoading === "portal" ? "Abrindo…" : "Abrir Portal de Pagamentos"}
          </button>
        </div>
      )}

      {/* Warning for past_due */}
      {subStatus === "past_due" && (
        <div className="bg-amber-50 rounded-brand p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-heading font-semibold text-amber-800">Pagamento Pendente</h3>
              <p className="text-sm text-amber-700 mt-1">
                Houve um problema com seu pagamento. Atualize seu método de pagamento para evitar a suspensão do serviço.
              </p>
              <button
                onClick={handlePortal}
                className="mt-3 px-5 py-2 rounded-brand-sm bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
              >
                Atualizar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
