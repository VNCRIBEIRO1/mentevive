"use client";
import { useState, useEffect, useCallback } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

type PaymentRow = {
  payment: {
    id: string; amount: string; dueDate: string | null; method: string; status: string;
    paidAt: string | null; description: string | null;
    stripePaymentIntentId: string | null; stripeSessionId: string | null;
    checkoutUrl: string | null; externalReference: string | null;
    stripeStatus: string | null;
  };
  patientName: string;
};

type PatientOption = { id: string; name: string };
type PricingItem = { label: string; key: string; duration: string; value: string };

const statusLabel: Record<string, string> = {
  pending: "Pendente", paid: "Pago", overdue: "Atrasado",
  cancelled: "Cancelado", refunded: "Reembolsado",
};
const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-600", paid: "bg-green-100 text-green-600",
  overdue: "bg-red-100 text-red-500", cancelled: "bg-gray-100 text-gray-500",
  refunded: "bg-blue-100 text-blue-500",
};
const methodLabel: Record<string, string> = {
  pix: "PIX", credit_card: "Cartão de Crédito", debit_card: "Cartão de Débito",
  bank_transfer: "Transferência", cash: "Dinheiro", stripe: "Stripe",
};

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function FinanceiroPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editPayment, setEditPayment] = useState<PaymentRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [selectedPricing, setSelectedPricing] = useState("");
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);

  const fetchPayments = useCallback(() => {
    setLoading(true);
    fetch("/api/payments")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPayments(Array.isArray(d) ? d : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const fetchPatients = useCallback(() => {
    fetch("/api/patients")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setPatients(Array.isArray(d) ? d.map((p: Record<string, unknown>) => ({ id: p.id as string, name: p.name as string })) : []))
      .catch(() => setPatients([]));
  }, []);

  const fetchPricing = useCallback(() => {
    fetch("/api/settings?key=pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.value && Array.isArray(d.value)) {
          setPricing(d.value as PricingItem[]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPayments();
      void fetchPatients();
      void fetchPricing();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPayments, fetchPatients, fetchPricing]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handlePricingSelect = (key: string) => {
    setSelectedPricing(key);
    if (key) {
      const item = pricing.find((p) => p.key === key);
      if (item) setNewAmount(item.value);
    }
  };

  const paid = payments.filter((p) => p.payment.status === "paid");
  const pending = payments.filter((p) => p.payment.status === "pending");
  const overdue = payments.filter((p) => p.payment.status === "overdue");
  const totalPaid = paid.reduce((s, p) => s + Number(p.payment.amount), 0);
  const totalPending = pending.reduce((s, p) => s + Number(p.payment.amount), 0);
  const totalOverdue = overdue.reduce((s, p) => s + Number(p.payment.amount), 0);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const amount = newAmount || fd.get("amount");
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: fd.get("patientId"),
          amount,
          method: fd.get("method"),
          dueDate: fd.get("dueDate") || null,
          description: fd.get("description") || null,
        }),
      });
      if (res.ok) {
        flash("Pagamento registrado! ✅");
        setShowModal(false);
        setNewAmount("");
        setSelectedPricing("");
        fetchPayments();
      } else {
        const body = await res.json().catch(() => ({}));
        flash((body as Record<string, string>).error || "Erro ao criar pagamento.");
      }
    } catch { flash("Erro de conexão."); }
    setSaving(false);
  };

  const markAsPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/payments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "paid", paidAt: new Date().toISOString() }),
      });
      if (res.ok) {
        flash("Pagamento confirmado! ✅");
        fetchPayments();
      } else flash("Erro ao atualizar pagamento.");
    } catch { flash("Erro de conexão."); }
  };

  const generateStripeLink = async (paymentId: string) => {
    setGeneratingLinkId(paymentId);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        await navigator.clipboard.writeText(data.checkoutUrl);
        flash("Link de pagamento copiado! 📋");
        fetchPayments();
      } else if (res.status === 503) {
        flash("⚠️ Stripe não configurado. Configure as variáveis de ambiente.");
      } else {
        flash(data.error || "Erro ao gerar link de pagamento.");
      }
    } catch { flash("Erro de conexão."); }
    setGeneratingLinkId(null);
  };

  const copyCheckoutUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    flash("Link copiado! 📋");
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-txt">Financeiro</h1>
          <p className="text-sm text-txt-light mt-1">Gerencie pagamentos e receitas</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-brand-primary text-sm">+ Novo Pagamento</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <p className="text-xs text-txt-muted font-medium">Receita (Pagos)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-txt-muted mt-1">{paid.length} pagamento(s)</p>
        </div>
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <p className="text-xs text-txt-muted font-medium">Pendente</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-txt-muted mt-1">{pending.length} pagamento(s)</p>
        </div>
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <p className="text-xs text-txt-muted font-medium">Atrasado</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-txt-muted mt-1">{overdue.length} pagamento(s)</p>
        </div>
      </div>

      {/* Pricing Reference */}
      {pricing.length > 0 && (
        <div className="bg-card rounded-brand p-5 shadow-sm border border-primary/5 mb-8">
          <h3 className="text-xs font-bold text-txt-muted uppercase tracking-wide mb-3">💰 Tabela de Preços (Configurações)</h3>
          <div className="flex flex-wrap gap-3">
            {pricing.map((p) => (
              <div key={p.key} className="bg-bg/50 rounded-brand-sm px-4 py-2.5 border border-primary/5">
                <p className="text-xs font-bold text-txt">{p.label}</p>
                <p className="text-sm font-bold text-primary-dark mt-0.5">R$ {Number(p.value).toFixed(2)}</p>
                <p className="text-[0.65rem] text-txt-muted">{p.duration}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-card rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Paciente</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Vencimento</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Método</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-txt-muted">
                    {loading ? "Carregando…" : "Nenhum pagamento registrado. Clique em \"+ Novo Pagamento\" para adicionar."}
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.payment.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-txt">{p.patientName}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{formatCurrency(Number(p.payment.amount))}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{p.payment.dueDate ? formatDate(p.payment.dueDate) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{methodLabel[p.payment.method] || p.payment.method || "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold ${statusColor[p.payment.status] || ""}`}>
                        {statusLabel[p.payment.status] || p.payment.status}
                      </span>
                      {p.payment.stripeStatus && (
                        <span className="block text-[0.6rem] text-txt-muted mt-0.5" title="Status no Stripe">
                          Stripe: {p.payment.stripeStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setEditPayment(p)}
                          className="text-xs text-primary-dark font-bold hover:underline"
                        >
                          Editar
                        </button>
                        {(p.payment.status === "pending" || p.payment.status === "overdue") && (
                          <button
                            onClick={() => markAsPaid(p.payment.id)}
                            className="text-xs text-green-600 font-bold hover:underline"
                          >
                            Marcar pago
                          </button>
                        )}
                        {(p.payment.status === "pending" || p.payment.status === "overdue") && !p.payment.checkoutUrl && (
                          <button
                            onClick={() => generateStripeLink(p.payment.id)}
                            disabled={generatingLinkId === p.payment.id}
                            className="text-xs text-[#635bff] font-bold hover:underline disabled:opacity-50"
                          >
                            {generatingLinkId === p.payment.id ? "Gerando…" : "🔗 Gerar Link Stripe"}
                          </button>
                        )}
                        {p.payment.checkoutUrl && (
                          <button
                            onClick={() => copyCheckoutUrl(p.payment.checkoutUrl!)}
                            className="text-xs text-[#009ee3] font-bold hover:underline"
                            title={p.payment.checkoutUrl}
                          >
                            📋 Copiar Link
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-card rounded-brand p-8 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Novo Pagamento</h3>
              <button onClick={() => { setShowModal(false); setNewAmount(""); setSelectedPricing(""); }} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Paciente *</label>
                <select name="patientId" required className={inputCls}>
                  <option value="">Selecione o paciente</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {pricing.length > 0 && (
                <div>
                  <label className="block text-xs font-bold mb-1.5">Tipo de Sessão (referência de preço)</label>
                  <select
                    value={selectedPricing}
                    onChange={(e) => handlePricingSelect(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Selecionar tipo (opcional)</option>
                    {pricing.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label} — {p.duration} — R$ {Number(p.value).toFixed(2)}
                      </option>
                    ))}
                  </select>
                  {selectedPricing && (
                    <p className="text-xs text-green-600 mt-1">
                      💰 Valor preenchido automaticamente: R$ {Number(newAmount).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold mb-1.5">Valor (R$) *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="150.00"
                  value={newAmount}
                  onChange={(e) => { setNewAmount(e.target.value); setSelectedPricing(""); }}
                  className={inputCls}
                />
                {pricing.length > 0 && !selectedPricing && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {pricing.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => { setNewAmount(p.value); setSelectedPricing(p.key); }}
                        className="text-[0.65rem] px-2 py-1 bg-primary/5 text-primary-dark border border-primary/15 rounded-brand-sm hover:bg-primary/10 transition-colors"
                      >
                        {p.label}: R$ {Number(p.value).toFixed(2)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Método de Pagamento</label>
                <select name="method" className={inputCls}>
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Data de Vencimento</label>
                <input name="dueDate" type="date" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Descrição</label>
                <input name="description" type="text" placeholder="Ex: Sessão individual — Março" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
                  {saving ? "Salvando…" : "Registrar Pagamento 🌿"}
                </button>
                <button type="button" onClick={() => { setShowModal(false); setNewAmount(""); setSelectedPricing(""); }} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-card rounded-brand p-8 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Editar Pagamento</h3>
              <button onClick={() => setEditPayment(null)} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>
            <p className="text-sm text-txt-muted mb-4">Paciente: <strong>{editPayment.patientName}</strong></p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await fetch("/api/payments", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: editPayment.payment.id,
                      amount: fd.get("amount"),
                      method: fd.get("method"),
                      status: fd.get("status"),
                      dueDate: fd.get("dueDate") || null,
                      description: fd.get("description") || null,
                      paidAt: fd.get("status") === "paid" ? (editPayment.payment.paidAt || new Date().toISOString()) : null,
                    }),
                  });
                  if (res.ok) {
                    flash("Pagamento atualizado! ✅");
                    setEditPayment(null);
                    fetchPayments();
                  } else flash("Erro ao atualizar pagamento.");
                } catch { flash("Erro de conexão."); }
                setSaving(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold mb-1.5">Valor (R$)</label>
                <input name="amount" type="number" step="0.01" defaultValue={editPayment.payment.amount} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Método de Pagamento</label>
                <select name="method" defaultValue={editPayment.payment.method} className={inputCls}>
                  <option value="pix">PIX</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="debit_card">Cartão de Débito</option>
                  <option value="bank_transfer">Transferência Bancária</option>
                  <option value="cash">Dinheiro</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Status</label>
                <select name="status" defaultValue={editPayment.payment.status} className={inputCls}>
                  <option value="pending">Pendente</option>
                  <option value="paid">Pago</option>
                  <option value="overdue">Atrasado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Data de Vencimento</label>
                <input name="dueDate" type="date" defaultValue={editPayment.payment.dueDate?.slice(0, 10) || ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Descrição</label>
                <input name="description" type="text" defaultValue={editPayment.payment.description || ""} className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
                  {saving ? "Salvando…" : "Salvar Alterações 🌿"}
                </button>
                <button type="button" onClick={() => setEditPayment(null)} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
