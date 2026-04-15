"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";

type Group = {
  id: string;
  name: string;
  description: string | null;
  modality: string;
  dayOfWeek: string | null;
  time: string | null;
  maxParticipants: number;
  price: string | null;
  active: boolean;
};

type GroupMember = {
  id: string;
  patientId: string;
  patientName: string;
  joinedAt: string;
  active: boolean;
};

type PatientOption = { id: string; name: string };

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function GruposAdminPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [viewMembers, setViewMembers] = useState<{ group: Group; members: GroupMember[] } | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<PatientOption[]>([]);
  const [addPatientId, setAddPatientId] = useState("");

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/groups")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setGroups(Array.isArray(d) ? d : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchGroups();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          description: fd.get("description"),
          modality: fd.get("modality"),
          dayOfWeek: fd.get("dayOfWeek"),
          time: fd.get("time"),
          maxParticipants: Number(fd.get("maxParticipants")) || 8,
          price: fd.get("price") || null,
        }),
      });
      if (res.ok) {
        flash("Grupo criado com sucesso! ✅");
        setShowModal(false);
        fetchGroups();
      } else {
        const body = await res.json().catch(() => ({}));
        flash((body as Record<string, string>).error || "Erro ao criar grupo.");
      }
    } catch { flash("Erro de conexão."); }
    setSaving(false);
  };

  const handleViewMembers = async (group: Group) => {
    setMembersLoading(true);
    setViewMembers({ group, members: [] });
    setAddPatientId("");
    try {
      const [membersRes, patientsRes] = await Promise.all([
        fetch(`/api/groups/${group.id}/members`),
        allPatients.length === 0 ? fetch("/api/patients") : Promise.resolve(null),
      ]);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setViewMembers({ group, members: Array.isArray(data) ? data : [] });
      }
      if (patientsRes && patientsRes.ok) {
        const pData = await patientsRes.json();
        const pts = Array.isArray(pData)
          ? pData.map((p: { id?: string; patient?: { id: string }; name?: string; patientName?: string }) => ({
              id: p.id || p.patient?.id || "",
              name: p.name || p.patientName || "",
            }))
          : [];
        setAllPatients(pts);
      }
    } catch { /* ignore */ }
    setMembersLoading(false);
  };

  const handleAddMember = async () => {
    if (!addPatientId || !viewMembers) return;
    try {
      const res = await fetch(`/api/groups/${viewMembers.group.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: addPatientId }),
      });
      if (res.ok) {
        flash("Membro adicionado! ✅");
        setAddPatientId("");
        handleViewMembers(viewMembers.group);
      } else {
        const body = await res.json().catch(() => ({}));
        flash((body as Record<string, string>).error || "Erro ao adicionar membro.");
      }
    } catch { flash("Erro de conexão."); }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!viewMembers || !confirm("Remover este membro do grupo?")) return;
    try {
      const res = await fetch(`/api/groups/${viewMembers.group.id}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        flash("Membro removido.");
        handleViewMembers(viewMembers.group);
      } else {
        flash("Erro ao remover membro.");
      }
    } catch { flash("Erro de conexão."); }
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-txt">Grupos Terapêuticos</h1>
          <p className="text-sm text-txt-light mt-1">Gerencie grupos e participantes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-brand-primary text-sm">+ Novo Grupo</button>
      </div>

      <div className="bg-white rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Grupo</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Modalidade</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Dia/Hora</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Vagas</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-txt-muted">
                    {loading ? "Carregando…" : "Nenhum grupo cadastrado. Clique em \"+ Novo Grupo\" para criar."}
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-txt">{g.name}</p>
                      {g.description && <p className="text-xs text-txt-muted mt-0.5 truncate max-w-[200px]">{g.description}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm text-txt-light capitalize">{g.modality}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{g.dayOfWeek || "—"} {g.time || ""}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{g.maxParticipants}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{g.price ? formatCurrency(Number(g.price)) : "—"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold ${g.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                        {g.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewMembers(g)}
                        className="text-xs text-primary-dark font-bold hover:underline"
                      >
                        Membros
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-brand p-8 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Novo Grupo</h3>
              <button onClick={() => setShowModal(false)} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5">Nome do Grupo *</label>
                <input name="name" type="text" required placeholder="Ex: Grupo de Ansiedade" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Descrição</label>
                <textarea name="description" rows={3} placeholder="Descrição do grupo…" className={inputCls + " resize-y"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">Modalidade</label>
                  <div className={inputCls + " bg-gray-50"}>Online</div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">Dia da Semana</label>
                  <select name="dayOfWeek" className={inputCls}>
                    <option value="">Selecione</option>
                    <option value="Segunda">Segunda</option>
                    <option value="Terça">Terça</option>
                    <option value="Quarta">Quarta</option>
                    <option value="Quinta">Quinta</option>
                    <option value="Sexta">Sexta</option>
                    <option value="Sábado">Sábado</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">Horário</label>
                  <input name="time" type="time" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">Máx. Participantes</label>
                  <input name="maxParticipants" type="number" defaultValue={8} min={2} max={30} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">Valor (R$)</label>
                <input name="price" type="number" step="0.01" placeholder="0.00" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
                  {saving ? "Criando…" : "Criar Grupo 🌿"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {viewMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-brand p-8 shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Membros — {viewMembers.group.name}</h3>
              <button onClick={() => setViewMembers(null)} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>

            {/* Add member */}
            <div className="mb-4 flex gap-2">
              <select
                value={addPatientId}
                onChange={(e) => setAddPatientId(e.target.value)}
                className={inputCls + " flex-1"}
              >
                <option value="">Selecione paciente…</option>
                {allPatients
                  .filter((p) => !viewMembers.members.some((m) => m.patientId === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!addPatientId}
                className="px-3 py-2 text-xs font-bold bg-primary text-white rounded-brand-sm hover:bg-primary-dark disabled:opacity-40 transition-colors"
              >
                + Adicionar
              </button>
            </div>

            {membersLoading ? (
              <p className="text-sm text-txt-muted text-center py-8">Carregando…</p>
            ) : viewMembers.members.length === 0 ? (
              <p className="text-sm text-txt-muted text-center py-8">Nenhum membro neste grupo.</p>
            ) : (
              <div className="space-y-2">
                {viewMembers.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 bg-bg/50 rounded-brand-sm">
                    <div>
                      <span className="text-sm text-txt font-medium">{m.patientName}</span>
                      <p className="text-[0.65rem] text-txt-muted">Desde {new Date(m.joinedAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="text-xs text-red-500 font-bold hover:underline"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-txt-muted mt-3">
              {viewMembers.members.length}/{viewMembers.group.maxParticipants} vagas preenchidas
            </p>
            <div className="mt-6 text-right">
              <button onClick={() => setViewMembers(null)} className="text-xs px-3 py-1.5 border border-primary/15 text-txt-muted rounded-brand-sm hover:bg-bg transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
