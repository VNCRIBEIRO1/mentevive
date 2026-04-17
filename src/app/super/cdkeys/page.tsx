"use client";
import { useState, useEffect } from "react";

type CDKey = {
  id: string;
  code: string;
  plan: string;
  durationDays: number;
  tenantId: string | null;
  tenantName: string | null;
  redeemedAt: string | null;
  createdAt: string;
};

type Stats = { total: number; available: number; used: number };

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-400",
  basico: "bg-blue-500/20 text-blue-400",
  pro: "bg-teal-500/20 text-teal-400",
  starter: "bg-blue-500/20 text-blue-400",
  professional: "bg-purple-500/20 text-purple-400",
  enterprise: "bg-amber-500/20 text-amber-400",
};

export default function CDKeysPage() {
  const [keys, setKeys] = useState<CDKey[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, used: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [quantity, setQuantity] = useState(5);
  const [plan, setPlan] = useState("basico");
  const [durationDays, setDurationDays] = useState(30);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/super/cdkeys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys ?? []);
        setStats(data.stats ?? { total: 0, available: 0, used: 0 });
      }
    } catch {}
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/super/cdkeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity, plan, durationDays }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToast({ msg: `${data.count} CDKey(s) gerada(s) com sucesso!`, type: "success" });
        fetchKeys();
      } else {
        setToast({ msg: data.error || "Erro ao gerar CDKeys.", type: "error" });
      }
    } catch {
      setToast({ msg: "Erro de conexão.", type: "error" });
    }
    setGenerating(false);
  }

  async function copyCode(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }

  return (
    <div className="max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg border text-sm font-medium ${
          toast.type === "success" ? "bg-green-900/50 text-green-300 border-green-700" : "bg-red-900/50 text-red-300 border-red-700"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-txt">CDKeys</h1>
        <p className="text-sm text-txt-muted mt-1">Gere e gerencie códigos de ativação para novos clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Total</p>
          <p className="text-3xl font-bold text-txt">{loading ? "—" : stats.total}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Disponíveis</p>
          <p className="text-3xl font-bold text-green-400">{loading ? "—" : stats.available}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-5">
          <p className="text-xs text-txt-muted uppercase tracking-wider mb-1">Utilizadas</p>
          <p className="text-3xl font-bold text-purple-400">{loading ? "—" : stats.used}</p>
        </div>
      </div>

      {/* Generate Section */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-txt mb-4">Gerar Novas CDKeys</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-txt-muted block mb-1">Quantidade</label>
            <input
              type="number"
              min={1}
              max={50}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-txt-muted block mb-1">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-purple-500"
            >
              <option value="basico">Básico (30 dias)</option>
              <option value="pro">Pro (90 dias)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-txt-muted block mb-1">Dias</label>
            <input
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-bg border border-border rounded-lg text-sm text-txt focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {generating ? "Gerando…" : "Gerar CDKeys"}
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-txt">Todas as CDKeys</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-sm text-txt-muted">Carregando…</div>
        ) : keys.length === 0 ? (
          <div className="p-6 text-center text-sm text-txt-muted">Nenhuma CDKey gerada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Código</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Plano</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Dias</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Usado por</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-txt-muted uppercase">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-3">
                      <button
                        onClick={() => copyCode(k.code, k.id)}
                        className="font-mono text-xs text-txt hover:text-purple-400 transition-colors"
                        title="Clique para copiar"
                      >
                        {k.code}
                        <span className="ml-2 text-[0.65rem] text-txt-muted">
                          {copiedId === k.id ? "✓ Copiado" : "📋"}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[k.plan] ?? "bg-gray-500/20 text-gray-400"}`}>
                        {k.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-txt-muted">{k.durationDays}d</td>
                    <td className="px-6 py-3">
                      {k.redeemedAt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">
                          Usado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          Disponível
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-txt-muted text-xs">
                      {k.tenantName || "—"}
                      {k.redeemedAt && (
                        <span className="block text-[0.65rem]">
                          {new Date(k.redeemedAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-txt-muted text-xs">
                      {new Date(k.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
