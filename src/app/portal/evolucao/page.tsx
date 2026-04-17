"use client";
import { useState, useEffect } from "react";
import { Sprout } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";
import { GrowthLine } from "@/components/portal/PortalIllustrations";

type Session = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  modality: string;
  status: string;
  therapistFeedback: string | null;
  patientNotes: string | null;
};

type EvolutionData = {
  totalSessions: number;
  sessions: Session[];
  records: Array<{ id: string; sessionDate: string; type: string }>;
};

export default function EvolucaoPage() {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/evolution")
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PortalPageHeader
        icon={<Sprout className="w-6 h-6" />}
        title="Minha Evolução"
        subtitle="Acompanhe o histórico do seu processo terapêutico"
        gradient="teal"
      />

      {/* Growth visualization */}
      <div className="flex justify-center mb-6">
        <GrowthLine className="w-64 h-12 opacity-80" />
      </div>

      {/* Summary card */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gradient-to-br from-teal/8 to-transparent rounded-2xl p-5 ring-1 ring-teal/10 text-center">
          <p className="text-3xl font-bold text-teal-dark">{data?.totalSessions ?? 0}</p>
          <p className="text-xs text-txt-muted mt-1">Sessões realizadas</p>
        </div>
        <div className="bg-gradient-to-br from-accent/8 to-transparent rounded-2xl p-5 ring-1 ring-accent/10 text-center">
          <p className="text-3xl font-bold text-accent">{data?.records.length ?? 0}</p>
          <p className="text-xs text-txt-muted mt-1">Registros clínicos</p>
        </div>
      </div>

      {/* Timeline */}
      {!data?.sessions.length ? (
        <div className="text-center py-14 bg-card rounded-2xl border border-primary/5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal/8 flex items-center justify-center mb-4">
            <Sprout className="w-7 h-7 text-teal" />
          </div>
          <p className="text-txt-muted text-sm">Suas sessões realizadas aparecerão aqui como uma linha do tempo.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal/30 via-primary/20 to-accent/30" />

          <div className="space-y-6">
            {data.sessions.map((s, i) => (
              <div key={s.id} className="relative pl-10">
                {/* Dot */}
                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-gradient-to-br from-teal to-primary border-2 border-white shadow-sm" />

                <div className="bg-card rounded-2xl p-5 shadow-warm-sm border border-primary/5 hover:shadow-warm-md transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-txt">
                        Sessão #{data.totalSessions - i}
                      </p>
                      <p className="text-xs text-txt-muted">
                        {new Date(s.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })} • {s.startTime} - {s.endTime}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary-dark capitalize">
                      {s.modality}
                    </span>
                  </div>

                  {s.therapistFeedback && (
                    <div className="bg-purple-50 border border-purple-100 rounded-brand-sm p-3 mt-3">
                      <span className="text-purple-600 text-xs font-bold">💬 Feedback da terapeuta:</span>
                      <p className="text-sm text-txt mt-1">{s.therapistFeedback}</p>
                    </div>
                  )}

                  {s.patientNotes && (
                    <div className="bg-blue-50 border border-blue-100 rounded-brand-sm p-3 mt-3">
                      <span className="text-blue-600 text-xs font-bold">📝 Minha anotação:</span>
                      <p className="text-sm text-txt mt-1">{s.patientNotes}</p>
                    </div>
                  )}

                  {!s.therapistFeedback && !s.patientNotes && (
                    <p className="text-xs text-txt-muted mt-2 italic">Nenhuma anotação para esta sessão.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
