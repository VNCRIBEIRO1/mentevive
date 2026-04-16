"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, CalendarPlus } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

interface Payment {
  id: string;
  amount: string;
  status: string;
  method: string | null;
  dueDate: string | null;
  paidAt: string | null;
  description: string | null;
  checkoutUrl: string | null;
  stripeStatus: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-purple-100 text-purple-700",
};
const statusLabels: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};
const methodLabels: Record<string, string> = {
  pix: "PIX",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  bank_transfer: "Transferência",
  cash: "Dinheiro",
  stripe: "Stripe",
};

function PagamentosContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const searchParams = useSearchParams();

  const fetchPayments = useCallback(() => {
    fetch("/api/portal/payments")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data)
          ? data.map((row: Record<string, unknown>) => (row.payment ?? row) as Payment)
          : [];
        setPayments(list);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle Stripe return status from query params
  useEffect(() => {
    const stripeStatus = searchParams.get("stripe_status");
    if (stripeStatus === "success") {
      setToast({ type: "success", message: "✅ Pagamento aprovado! Obrigada pela confiança. 💜" });
      // Refresh payments to show updated status
      setTimeout(() => fetchPayments(), 2000);
    } else if (stripeStatus === "pending") {
      setToast({ type: "info", message: "⏳ Pagamento pendente. Assim que for confirmado, atualizaremos aqui." });
    } else if (stripeStatus === "cancelled") {
      setToast({ type: "error", message: "❌ Pagamento não foi concluído. Tente novamente ou escolha outro método." });
    }
  }, [searchParams, fetchPayments]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);
  const totalPending = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((sum, p) => sum + parseFloat(p.amount || "0"), 0);

  const fmtCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

  /** Create Stripe Checkout Session on-demand and redirect to checkout */
  const handlePagar = async (paymentId: string) => {
    setPayingId(paymentId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setToast({ type: "info", message: "Pagamento online ainda não está disponível. Entre em contato pelo WhatsApp." });
        } else {
          setToast({ type: "error", message: data.error || "Erro ao gerar link de pagamento." });
        }
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch {
      setToast({ type: "error", message: "Erro ao conectar com o sistema de pagamento." });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div>
      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          aria-live="polite"
          className={`mb-6 px-5 py-4 rounded-brand text-sm font-medium border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right font-bold hover:opacity-60">✕</button>
        </div>
      )}

      <PortalPageHeader
        icon={<CreditCard className="w-6 h-6" />}
        title="Meus Pagamentos"
        subtitle="Histórico de pagamentos e pendências"
        gradient="primary"
        action={
          <Link href="/portal/agendar" className="btn-brand-primary text-sm inline-flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" /> Agendar Sessão
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-transparent rounded-2xl p-6 ring-1 ring-green-100">
          <p className="text-xs text-txt-muted font-medium">Total Pago</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmtCurrency(totalPaid)}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-transparent rounded-2xl p-6 ring-1 ring-yellow-100">
          <p className="text-xs text-txt-muted font-medium">Pendente</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{fmtCurrency(totalPending)}</p>
        </div>
        <div className="bg-gradient-to-br from-primary/8 to-transparent rounded-2xl p-6 ring-1 ring-primary/10">
          <p className="text-xs text-txt-muted font-medium">Total de Pagamentos</p>
          <p className="text-2xl font-bold text-txt mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "pending", label: "Pendentes" },
          { key: "paid", label: "Pagos" },
          { key: "overdue", label: "Atrasados" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              filter === key ? "bg-primary text-white" : "bg-white border border-primary/15 text-txt-light hover:bg-bg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Vencimento</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Descrição</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Método</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-txt-muted">Carregando…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-txt-muted">
                    {filter === "all" ? "Nenhum pagamento encontrado." : `Nenhum pagamento ${statusLabels[filter]?.toLowerCase() || ""}.`}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-txt">{fmtDate(p.dueDate || p.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-txt-light max-w-[200px] truncate">
                      {p.description || "Sessão de Psicologia"}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-txt">
                      {fmtCurrency(parseFloat(p.amount || "0"))}
                    </td>
                    <td className="px-6 py-4 text-sm text-txt-light">
                      {p.method ? methodLabels[p.method] || p.method : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColors[p.status] || "bg-gray-100 text-gray-500"}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                      {p.stripeStatus && p.stripeStatus !== p.status && (
                        <span className="block text-[10px] text-txt-muted mt-0.5">
                          Stripe: {p.stripeStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(p.status === "pending" || p.status === "overdue") && (
                        <button
                          onClick={() => handlePagar(p.id)}
                          disabled={payingId === p.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#635bff] text-white text-xs font-bold rounded-lg hover:bg-[#4b45c6] transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                          {payingId === p.id ? (
                            <>⏳ Gerando…</>
                          ) : (
                            <>💳 Pagar agora</>
                          )}
                        </button>
                      )}
                      {p.status === "paid" && p.paidAt && (
                        <span className="text-xs text-green-600">Pago em {fmtDate(p.paidAt)}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-blue-50 border border-blue-200 rounded-brand p-5 mt-6">
        <p className="text-sm font-semibold text-blue-800 mb-1">💳 Sobre o pagamento online</p>
        <p className="text-sm text-blue-700">
          Ao clicar em &quot;Pagar agora&quot;, você será redirecionado(a) para o ambiente seguro do Stripe, 
          onde poderá pagar com cartão de crédito, débito ou PIX.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          Se preferir, entre em contato pelo{" "}
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="underline font-bold">
            WhatsApp
          </a>{" "}
          para combinar outra forma de pagamento.
        </p>
      </div>
    </div>
  );
}

export default function PortalPagamentosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <PagamentosContent />
    </Suspense>
  );
}