"use client";

import { useEffect, useState } from "react";

export type WaitingRoomTriageData = {
  completed: boolean;
  mood?: string | null;
  sleepQuality?: string | null;
  anxietyLevel?: number | null;
  mainConcern?: string | null;
  recentEvents?: string | null;
  medicationChanges?: string | null;
  additionalNotes?: string | null;
};

type WaitingRoomTriageCardProps = {
  appointmentId: string;
  initialTriage: WaitingRoomTriageData | null;
  isAdminView?: boolean;
  onSaved?: (triage: WaitingRoomTriageData) => void;
};

const moodOptions = [
  { value: "muito_bem", label: "Muito bem" },
  { value: "bem", label: "Bem" },
  { value: "neutro", label: "Neutro" },
  { value: "mal", label: "Mal" },
  { value: "muito_mal", label: "Muito mal" },
];

const sleepLabels: Record<string, string> = {
  otimo: "Otimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  pessimo: "Pessimo",
};

const inputCls =
  "w-full rounded-brand-sm border-[1.5px] border-primary/15 bg-white px-3 py-2.5 text-sm text-txt focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10";

function buildInitialForm(triage: WaitingRoomTriageData | null) {
  return {
    mood: triage?.mood || "",
    sleepQuality: triage?.sleepQuality || "",
    anxietyLevel: triage?.anxietyLevel ?? 5,
    mainConcern: triage?.mainConcern || "",
    recentEvents: triage?.recentEvents || "",
    medicationChanges: triage?.medicationChanges || "",
    additionalNotes: triage?.additionalNotes || "",
  };
}

export function WaitingRoomTriageCard({
  appointmentId,
  initialTriage,
  isAdminView = false,
  onSaved,
}: WaitingRoomTriageCardProps) {
  const [form, setForm] = useState(() => buildInitialForm(initialTriage));
  const [editing, setEditing] = useState(() => !initialTriage?.completed);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(buildInitialForm(initialTriage));
    setEditing(!initialTriage?.completed);
  }, [initialTriage]);

  const isCompleted = !!initialTriage?.completed;

  const flashMessage = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 3000);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/portal/triagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId,
          ...form,
        }),
      });

      const payload = (await response.json()) as WaitingRoomTriageData & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Nao foi possivel salvar a triagem agora.");
        return;
      }

      const saved: WaitingRoomTriageData = {
        completed: true,
        mood: payload.mood ?? form.mood,
        sleepQuality: payload.sleepQuality ?? form.sleepQuality,
        anxietyLevel: payload.anxietyLevel ?? form.anxietyLevel,
        mainConcern: payload.mainConcern ?? form.mainConcern,
        recentEvents: payload.recentEvents ?? form.recentEvents,
        medicationChanges: payload.medicationChanges ?? form.medicationChanges,
        additionalNotes: payload.additionalNotes ?? form.additionalNotes,
      };

      onSaved?.(saved);
      setEditing(false);
      flashMessage("Triagem salva com sucesso.");
    } catch {
      setError("Erro de conexao ao salvar a triagem.");
    } finally {
      setSaving(false);
    }
  };

  if (isAdminView) {
    return (
      <div className={`mb-6 rounded-brand border p-5 ${isCompleted ? "border-green-200 bg-green-50" : "border-accent/20 bg-accent/5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-txt">{isCompleted ? "Triagem preenchida" : "Triagem pendente"}</p>
            <p className="mt-1 text-xs text-txt-muted">
              {isCompleted
                ? "As respostas desta sessao ja foram registradas."
                : "O paciente ainda nao preencheu a triagem desta sessao."}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${isCompleted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {isCompleted ? "Concluida" : "Pendente"}
          </span>
        </div>

        {isCompleted && (
          <div className="mt-4 grid gap-2 border-t border-green-200 pt-4 text-xs text-txt-light sm:grid-cols-2">
            <p><span className="font-semibold text-txt">Humor:</span> {form.mood || "-"}</p>
            <p><span className="font-semibold text-txt">Sono:</span> {sleepLabels[form.sleepQuality] || form.sleepQuality || "-"}</p>
            <p><span className="font-semibold text-txt">Ansiedade:</span> {form.anxietyLevel ?? "-"}/10</p>
            <p><span className="font-semibold text-txt">Foco:</span> {form.mainConcern || "-"}</p>
            {form.recentEvents && <p className="sm:col-span-2"><span className="font-semibold text-txt">Eventos recentes:</span> {form.recentEvents}</p>}
            {form.medicationChanges && <p className="sm:col-span-2"><span className="font-semibold text-txt">Medicacao:</span> {form.medicationChanges}</p>}
            {form.additionalNotes && <p className="sm:col-span-2"><span className="font-semibold text-txt">Notas:</span> {form.additionalNotes}</p>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`mb-6 rounded-brand border p-5 ${isCompleted ? "border-green-200 bg-green-50" : "border-accent/20 bg-accent/5"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-txt">Triagem dentro da Sala de Espera</p>
          <p className="mt-1 text-xs text-txt-muted">
            Preencha por aqui antes da sessao. Nao e preciso sair desta tela.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${isCompleted ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {isCompleted ? "Concluida" : "Pendente"}
          </span>
          {isCompleted && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-primary-dark hover:underline"
            >
              Editar
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-brand-sm border border-green-200 bg-white/80 px-3 py-2 text-xs text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-brand-sm border border-red-200 bg-white/80 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {isCompleted && !editing ? (
        <div className="mt-4 grid gap-2 border-t border-green-200 pt-4 text-xs text-txt-light sm:grid-cols-2">
          <p><span className="font-semibold text-txt">Humor:</span> {form.mood || "-"}</p>
          <p><span className="font-semibold text-txt">Sono:</span> {sleepLabels[form.sleepQuality] || form.sleepQuality || "-"}</p>
          <p><span className="font-semibold text-txt">Ansiedade:</span> {form.anxietyLevel ?? "-"}/10</p>
          <p><span className="font-semibold text-txt">Foco:</span> {form.mainConcern || "-"}</p>
          {form.recentEvents && <p className="sm:col-span-2"><span className="font-semibold text-txt">Eventos recentes:</span> {form.recentEvents}</p>}
          {form.medicationChanges && <p className="sm:col-span-2"><span className="font-semibold text-txt">Medicacao:</span> {form.medicationChanges}</p>}
          {form.additionalNotes && <p className="sm:col-span-2"><span className="font-semibold text-txt">Notas:</span> {form.additionalNotes}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-primary/10 pt-4">
          <div>
            <label className="mb-2 block text-xs font-bold text-txt">Como voce esta se sentindo agora? *</label>
            <div className="flex flex-wrap gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, mood: option.value }))}
                  className={`rounded-brand-sm border px-3 py-2 text-xs font-medium transition-colors ${
                    form.mood === option.value
                      ? "border-primary bg-primary/10 text-primary-dark"
                      : "border-primary/10 bg-white text-txt hover:border-primary/30"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-txt">
              Sono recente
              <select
                value={form.sleepQuality}
                onChange={(event) => setForm((current) => ({ ...current, sleepQuality: event.target.value }))}
                className={`${inputCls} mt-1`}
              >
                <option value="">Selecione</option>
                <option value="otimo">Otimo</option>
                <option value="bom">Bom</option>
                <option value="regular">Regular</option>
                <option value="ruim">Ruim</option>
                <option value="pessimo">Pessimo</option>
              </select>
            </label>

            <label className="block text-xs font-bold text-txt">
              Nivel de ansiedade: {form.anxietyLevel}/10
              <input
                type="range"
                min={0}
                max={10}
                value={form.anxietyLevel}
                onChange={(event) => setForm((current) => ({ ...current, anxietyLevel: Number(event.target.value) }))}
                className="mt-3 w-full accent-primary"
              />
            </label>
          </div>

          <label className="block text-xs font-bold text-txt">
            Principal foco da sessao
            <textarea
              rows={3}
              value={form.mainConcern}
              onChange={(event) => setForm((current) => ({ ...current, mainConcern: event.target.value }))}
              placeholder="O que voce quer trabalhar hoje?"
              className={`${inputCls} mt-1 resize-y`}
            />
          </label>

          <label className="block text-xs font-bold text-txt">
            Algo importante aconteceu desde a ultima sessao?
            <textarea
              rows={3}
              value={form.recentEvents}
              onChange={(event) => setForm((current) => ({ ...current, recentEvents: event.target.value }))}
              placeholder="Eventos, mudancas ou situacoes marcantes"
              className={`${inputCls} mt-1 resize-y`}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-txt">
              Medicacao
              <input
                value={form.medicationChanges}
                onChange={(event) => setForm((current) => ({ ...current, medicationChanges: event.target.value }))}
                placeholder="Mudou algo?"
                className={`${inputCls} mt-1`}
              />
            </label>

            <label className="block text-xs font-bold text-txt">
              Observacoes extras
              <input
                value={form.additionalNotes}
                onChange={(event) => setForm((current) => ({ ...current, additionalNotes: event.target.value }))}
                placeholder="Algo a mais para registrar"
                className={`${inputCls} mt-1`}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving || !form.mood}
              className="btn-brand-primary disabled:opacity-50"
            >
              {saving ? "Salvando..." : isCompleted ? "Atualizar triagem" : "Salvar triagem"}
            </button>
            {isCompleted && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-brand-sm border border-primary/15 px-4 py-2.5 text-sm text-txt hover:bg-white"
              >
                Fechar edicao
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
