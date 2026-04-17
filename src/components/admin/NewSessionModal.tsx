"use client";
import type { PatientOption } from "./agenda-types";
import { inputCls } from "./agenda-types";

interface Props {
  patients: PatientOption[];
  selectedDate: string | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function NewSessionModal({ patients, selectedDate, saving, onClose, onCreate }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="bg-card rounded-brand p-8 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-heading text-lg font-semibold text-txt">Nova Sessão</h3>
          <button onClick={onClose} className="text-txt-muted hover:text-txt text-lg">X</button>
        </div>
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Paciente *</label>
            <select name="patientId" required className={inputCls}>
              <option value="">Selecione o paciente</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Data *</label>
            <input name="date" type="date" required defaultValue={selectedDate ?? ""} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5">Início *</label>
              <input name="startTime" type="time" step="60" required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">Fim *</label>
              <input name="endTime" type="time" step="60" required className={inputCls} />
            </div>
          </div>
          <input type="hidden" name="modality" value="online" />
          <div>
            <label className="block text-xs font-bold mb-1.5">Modalidade</label>
            <div className={inputCls + " bg-bg"}>Online (videochamada)</div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Status inicial</label>
            <select name="status" defaultValue="confirmed" className={inputCls}>
              <option value="confirmed">Confirmada</option>
              <option value="pending">Pendente</option>
            </select>
            <p className="text-[0.65rem] text-txt-muted mt-1">
              Sessões confirmadas criam cobrança automaticamente. Online gera link da videochamada.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">Observações</label>
            <textarea name="notes" rows={3} className={inputCls} placeholder="Notas sobre a sessão…" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-brand-primary flex-1 disabled:opacity-50">
              {saving ? "Agendando…" : "Agendar Sessão"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
