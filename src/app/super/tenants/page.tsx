"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface TenantRow {
  id: string;
  slug: string;
  name: string;
  plan: string;
  active: boolean;
  stripeOnboardingComplete: boolean;
  stripeAccountId: string | null;
  maxPatients: number;
  maxAppointmentsPerMonth: number;
  landingDomain: string | null;
  createdAt: string;
}

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"] as const;

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  starter: "bg-blue-500/20 text-blue-400",
  professional: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

export default function SuperTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    slug: "",
    name: "",
    ownerEmail: "",
    plan: "free" as typeof PLAN_OPTIONS[number],
    maxPatients: "50",
    maxAppointmentsPerMonth: "200",
    landingDomain: "",
  });

  const loadTenants = () => {
    setLoading(true);
    fetch("/api/super/tenants")
      .then((r) => r.json())
      .then((data) => {
        setTenants(data.tenants ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch("/api/super/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug,
          name: form.name,
          ownerEmail: form.ownerEmail || undefined,
          plan: form.plan,
          maxPatients: parseInt(form.maxPatients),
          maxAppointmentsPerMonth: parseInt(form.maxAppointmentsPerMonth),
          landingDomain: form.landingDomain || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Erro ao criar consultório.");
      } else {
        setShowForm(false);
        setForm({ slug: "", name: "", ownerEmail: "", plan: "free", maxPatients: "50", maxAppointmentsPerMonth: "200", landingDomain: "" });
        loadTenants();
      }
    } catch {
      setFormError("Erro de conexão.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold text-txt">Consultórios</h1>
          <p className="text-sm text-txt-muted mt-1">Gerencie os consultórios da plataforma</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          + Novo Consultório
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-txt mb-4">Criar Consultório</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-txt-muted mb-1">Nome *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
                placeholder="Nome do consultório"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1">Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt font-mono focus:outline-none focus:border-primary"
                placeholder="meu-consultorio"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1">Email do proprietário</label>
              <input
                type="email"
                value={form.ownerEmail}
                onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
                placeholder="admin@consultorio.com.br"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1">Plano</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as typeof PLAN_OPTIONS[number] })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
              >
                {PLAN_OPTIONS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1">Máx. Pacientes</label>
              <input
                type="number"
                value={form.maxPatients}
                onChange={(e) => setForm({ ...form, maxPatients: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-txt-muted mb-1">Máx. Sessões/Mês</label>
              <input
                type="number"
                value={form.maxAppointmentsPerMonth}
                onChange={(e) => setForm({ ...form, maxAppointmentsPerMonth: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-txt-muted mb-1">Domínio Landing (opcional)</label>
              <input
                type="text"
                value={form.landingDomain}
                onChange={(e) => setForm({ ...form, landingDomain: e.target.value })}
                className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
                placeholder="psicolobia.com.br"
              />
            </div>
            {formError && (
              <div className="sm:col-span-2 text-sm text-red-400">{formError}</div>
            )}
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {creating ? "Criando…" : "Criar Consultório"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-bg border border-border text-txt text-sm font-medium rounded-lg hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-txt-muted">Carregando…</div>
        ) : tenants.length === 0 ? (
          <div className="p-8 text-center text-sm text-txt-muted">
            Nenhum consultório cadastrado.{" "}
            <button onClick={() => setShowForm(true)} className="text-primary hover:underline">Criar o primeiro?</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Plano</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Stripe</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-txt">{t.name}</td>
                  <td className="px-6 py-4 text-txt-muted font-mono text-xs">{t.slug}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[t.plan] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {t.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.stripeOnboardingComplete ? "bg-green-500/20 text-green-400" : t.stripeAccountId ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {t.stripeOnboardingComplete ? "Completo" : t.stripeAccountId ? "Pendente" : "Não conectado"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {t.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/super/tenants/${t.id}`} className="text-primary text-xs hover:underline">
                      Gerenciar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
