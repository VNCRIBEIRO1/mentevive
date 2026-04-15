"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  plan: string;
  active: boolean;
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
  maxPatients: number;
  maxAppointmentsPerMonth: number;
  landingDomain: string | null;
  createdAt: string;
}

const PLAN_OPTIONS = ["free", "starter", "professional", "enterprise"] as const;

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: "",
    plan: "free" as typeof PLAN_OPTIONS[number],
    active: true,
    maxPatients: "50",
    maxAppointmentsPerMonth: "200",
    landingDomain: "",
  });

  useEffect(() => {
    fetch(`/api/super/tenants/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tenant) {
          setTenant(data.tenant);
          setMembers(data.members ?? []);
          setForm({
            name: data.tenant.name,
            plan: data.tenant.plan,
            active: data.tenant.active,
            maxPatients: String(data.tenant.maxPatients ?? 50),
            maxAppointmentsPerMonth: String(data.tenant.maxAppointmentsPerMonth ?? 200),
            landingDomain: data.tenant.landingDomain ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/super/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          plan: form.plan,
          active: form.active,
          maxPatients: parseInt(form.maxPatients),
          maxAppointmentsPerMonth: parseInt(form.maxAppointmentsPerMonth),
          landingDomain: form.landingDomain || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Erro ao salvar.");
      } else {
        setTenant(data.tenant);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setSaveError("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  };

  const ROLE_COLORS: Record<string, string> = {
    admin: "bg-purple-500/20 text-purple-400",
    therapist: "bg-blue-500/20 text-blue-400",
    patient: "bg-green-500/20 text-green-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-txt-muted">Carregando…</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-5xl">
        <p className="text-sm text-red-400">Consultório não encontrado.</p>
        <Link href="/super/tenants" className="text-primary text-sm hover:underline mt-2 inline-block">
          ← Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/super/tenants")}
          className="text-txt-muted text-sm hover:text-txt transition-colors"
        >
          ← Consultórios
        </button>
        <span className="text-txt-muted">/</span>
        <h1 className="text-xl font-heading font-bold text-txt">{tenant.name}</h1>
        <span className="text-xs text-txt-muted font-mono">({tenant.slug})</span>
      </div>

      {/* Edit form */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-txt mb-4">Configurações</h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-txt-muted mb-1">Nome</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
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
          <div>
            <label className="block text-xs text-txt-muted mb-1">Domínio Landing</label>
            <input
              type="text"
              value={form.landingDomain}
              onChange={(e) => setForm({ ...form, landingDomain: e.target.value })}
              className="w-full px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-primary"
              placeholder="psicolobia.com.br"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="block text-xs text-txt-muted">Status</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? "bg-green-500" : "bg-gray-600"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-xs text-txt-muted">{form.active ? "Ativo" : "Inativo"}</span>
          </div>
          {saveError && <div className="sm:col-span-2 text-sm text-red-400">{saveError}</div>}
          {saved && <div className="sm:col-span-2 text-sm text-green-400">Salvo com sucesso!</div>}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>

      {/* Stripe status */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-txt mb-4">Stripe Connect</h2>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tenant.stripeOnboardingComplete ? "bg-green-500/20 text-green-400" : tenant.stripeAccountId ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
            {tenant.stripeOnboardingComplete ? "Onboarding completo" : tenant.stripeAccountId ? "Conta criada, onboarding pendente" : "Não configurado"}
          </span>
          {tenant.stripeAccountId && (
            <span className="text-xs text-txt-muted font-mono">{tenant.stripeAccountId}</span>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-txt">Membros ({members.length})</h2>
        </div>
        {members.length === 0 ? (
          <div className="p-6 text-center text-sm text-txt-muted">Nenhum membro cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg/50">
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Papel</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-3 text-txt">{m.name}</td>
                  <td className="px-6 py-3 text-txt-muted">{m.email}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[m.role] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {m.active ? "Ativo" : "Inativo"}
                    </span>
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
