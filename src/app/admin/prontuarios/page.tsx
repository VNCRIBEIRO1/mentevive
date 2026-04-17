"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

type RecordRow = {
  id: string;
  patientId: string;
  patientName: string;
  sessionDate: string;
  sessionNumber: number | null;
  chiefComplaint: string | null;
  clinicalNotes: string | null;
  interventions: string | null;
  homework: string | null;
  mood: string | null;
  private: boolean;
};

const inputCls =
  "w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function ProntuariosPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editRecord, setEditRecord] = useState<RecordRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const fetchRecords = () => {
    setLoading(true);
    fetch("/api/clinical-records")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (!Array.isArray(d)) { setRecords([]); return; }
        setRecords(
          d.map((row: Record<string, unknown>) => {
            const rec = (row.record ?? row) as Record<string, unknown>;
            return {
              id: rec.id as string,
              patientId: rec.patientId as string,
              patientName: (row.patientName ?? "") as string,
              sessionDate: rec.sessionDate as string,
              sessionNumber: rec.sessionNumber as number | null,
              chiefComplaint: rec.chiefComplaint as string | null,
              clinicalNotes: rec.clinicalNotes as string | null,
              interventions: rec.interventions as string | null,
              homework: rec.homework as string | null,
              mood: rec.mood as string | null,
              private: (rec.private ?? true) as boolean,
            };
          })
        );
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchRecords();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = records.filter((r) =>
    r.patientName?.toLowerCase().includes(search.toLowerCase())
  );

  const moodLabel: Record<string, string> = {
    muito_bem: "😊 Muito bem",
    bem: "🙂 Bem",
    neutro: "😐 Neutro",
    mal: "😟 Mal",
    muito_mal: "😢 Muito mal",
  };

  return (
    <div>
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-card border border-primary/20 text-txt text-sm px-5 py-3 rounded-brand-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold text-txt">Prontuários</h1>
        <p className="text-sm text-txt-light mt-1">Registros clínicos dos pacientes</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nome do paciente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md py-2.5 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-brand shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-primary/10 bg-bg">
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Paciente</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Data da Sessão</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Sessão Nº</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Humor</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Queixa</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Visível</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-txt-muted uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-txt-muted">Carregando…</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-txt-muted">
                    {search ? "Nenhum registro encontrado para a busca." : "Nenhum registro clínico cadastrado. Acesse a ficha de um paciente para criar registros."}
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-b border-primary/5 hover:bg-bg/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-txt">{r.patientName || "—"}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{formatDate(r.sessionDate)}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{r.sessionNumber ?? "—"}</td>
                    <td className="px-6 py-4 text-sm text-txt-light">{r.mood ? (moodLabel[r.mood] || r.mood) : "—"}</td>
                    <td className="px-6 py-4 text-sm text-txt-light max-w-[200px] truncate">{r.chiefComplaint || "—"}</td>
                    <td className="px-6 py-4">
                      {r.private ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-amber-100 text-amber-700 border border-amber-200">🔒 Privado</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold bg-green-100 text-green-700 border border-green-200">👁️ Visível</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => setEditRecord(r)}
                        className="text-xs text-primary-dark font-bold hover:underline"
                      >
                        Editar
                      </button>
                      <Link
                        href={`/admin/pacientes/${r.patientId}`}
                        className="text-xs text-txt-muted font-bold hover:underline"
                      >
                        Ver paciente
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-card rounded-brand p-8 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-lg font-semibold text-txt">Editar Registro Clínico</h3>
              <button onClick={() => setEditRecord(null)} className="text-txt-muted hover:text-txt text-lg">✕</button>
            </div>
            <p className="text-sm text-txt-muted mb-4">Paciente: <strong>{editRecord.patientName}</strong></p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                const fd = new FormData(e.currentTarget);
                try {
                  const res = await fetch(`/api/clinical-records/${editRecord.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      chiefComplaint: fd.get("chiefComplaint"),
                      clinicalNotes: fd.get("clinicalNotes"),
                      interventions: fd.get("interventions"),
                      homework: fd.get("homework"),
                      mood: fd.get("mood"),
                      private: fd.get("private") === "on",
                    }),
                  });
                  if (res.ok) {
                    flash("Registro atualizado! ✅");
                    setEditRecord(null);
                    fetchRecords();
                  } else flash("Erro ao atualizar registro.");
                } catch { flash("Erro de conexão."); }
                setSaving(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold mb-1">Humor</label>
                <select name="mood" defaultValue={editRecord.mood || ""} className={inputCls}>
                  <option value="">Selecione</option>
                  <option value="muito_bem">Muito bem</option>
                  <option value="bem">Bem</option>
                  <option value="neutro">Neutro</option>
                  <option value="mal">Mal</option>
                  <option value="muito_mal">Muito mal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Queixa Principal</label>
                <input name="chiefComplaint" type="text" defaultValue={editRecord.chiefComplaint || ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Notas Clínicas</label>
                <textarea name="clinicalNotes" rows={4} defaultValue={editRecord.clinicalNotes || ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Intervenções</label>
                <textarea name="interventions" rows={2} defaultValue={editRecord.interventions || ""} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tarefa de Casa</label>
                <input name="homework" type="text" defaultValue={editRecord.homework || ""} className={inputCls} />
              </div>

              {/* Private toggle with clear visual warning */}
              <div className={`rounded-brand-sm border-2 p-3 ${editRecord.private ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="private"
                    defaultChecked={editRecord.private}
                    onChange={(e) => setEditRecord({ ...editRecord, private: e.target.checked })}
                    className="w-4 h-4 accent-amber-600"
                  />
                  <span className="text-xs font-bold">
                    {editRecord.private ? "🔒 Prontuário PRIVADO" : "👁️ Prontuário VISÍVEL ao paciente"}
                  </span>
                </label>
                <p className="text-[0.65rem] mt-1.5 ml-7 font-semibold">
                  {editRecord.private
                    ? "⚠️ Esta anotação o paciente NÃO verá — uso exclusivo da terapeuta."
                    : "✅ O paciente verá este registro na página de Evolução."}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
                  {saving ? "Salvando…" : "Salvar Alterações 🌿"}
                </button>
                <button type="button" onClick={() => setEditRecord(null)} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
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
