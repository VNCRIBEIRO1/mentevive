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
  createdAt: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  starter: "bg-blue-500/20 text-blue-400",
  professional: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

export default function SuperDashboard() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/super/tenants")
      .then((r) => r.json())
      .then((data) => {
        setTenants(data.tenants ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeTenants = tenants.filter((t) => t.active).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-txt">Super Admin</h1>
        <p className="text-sm text-txt-muted mt-1">Visão geral da plataforma MenteVive</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Total de Consultórios</p>
          <p className="text-3xl font-bold text-txt">{loading ? "—" : tenants.length}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Consultórios Ativos</p>
          <p className="text-3xl font-bold text-green-400">{loading ? "—" : activeTenants}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Stripe Conectado</p>
          <p className="text-3xl font-bold text-primary">
            {loading ? "—" : tenants.filter((t) => t.stripeOnboardingComplete).length}
          </p>
        </div>
      </div>

      {/* Tenants table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-txt">Consultórios</h2>
          <Link
            href="/super/tenants"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-txt-muted">Carregando…</div>
        ) : tenants.length === 0 ? (
          <div className="p-6 text-center text-sm text-txt-muted">Nenhum consultório cadastrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Slug</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Plano</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tenants.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-bg/50 transition-colors">
                  <td className="px-6 py-3 font-medium text-txt">{t.name}</td>
                  <td className="px-6 py-3 text-txt-muted font-mono">{t.slug}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[t.plan] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {PLAN_LABELS[t.plan] ?? t.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {t.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/super/tenants/${t.id}`} className="text-primary text-xs hover:underline">
                      Gerenciar
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
