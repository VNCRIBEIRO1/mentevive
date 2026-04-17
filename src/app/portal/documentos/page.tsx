"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { PortalPageHeader } from "@/components/portal/PortalPageHeader";

type PortalDocument = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  fileUrl: string | null;
  createdAt: string;
};

export default function PortalDocumentosPage() {
  const [docs, setDocs] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/documents")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, []);

  const sessionNotes = docs.filter((doc) => doc.type === "session_note");
  const otherDocs = docs.filter((doc) => doc.type !== "session_note");

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      <PortalPageHeader
        icon={<FileText className="w-6 h-6" />}
        title="Documentos e Notas"
        subtitle="Materiais da terapia, orientações pós-sessão e documentos emitidos"
        gradient="accent"
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <section className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-heading text-lg font-semibold text-txt">
                Notas da Sessão
              </h2>
              <p className="text-xs text-txt-muted mt-1">
                Exercícios, pontos de reflexão e lembretes deixados para você
              </p>
            </div>
            <span className="text-xs font-bold text-primary-dark bg-primary/10 px-3 py-1 rounded-full">
              {loading ? "..." : `${sessionNotes.length} nota(s)`}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-txt-muted">Carregando suas notas…</p>
          ) : sessionNotes.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl block mb-4">📝</span>
              <p className="text-sm text-txt font-semibold mb-2">
                Nenhuma nota disponível ainda.
              </p>
              <p className="text-xs text-txt-muted max-w-sm mx-auto">
                Após cada sessão, exercícios e lembretes práticos podem aparecer aqui para fácil consulta.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessionNotes.map((doc) => (
                <article
                  key={doc.id}
                  className="rounded-brand-sm border border-primary/10 bg-bg/40 p-5"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold text-txt">{doc.title}</h3>
                    <span className="text-[0.68rem] text-txt-muted">
                      {formatDate(doc.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-txt-light whitespace-pre-line leading-6">
                    {doc.content || "Sem conteúdo textual."}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
            <h2 className="font-heading text-lg font-semibold text-txt mb-4">
              Documentos Emitidos
            </h2>
            {loading ? (
              <p className="text-sm text-txt-muted">Carregando documentos…</p>
            ) : otherDocs.length === 0 ? (
              <p className="text-sm text-txt-muted">
                Nenhum documento formal emitido até o momento.
              </p>
            ) : (
              <div className="space-y-3">
                {otherDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-brand-sm border border-primary/10 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-txt">{doc.title}</p>
                    <p className="text-[0.7rem] text-txt-muted mt-1">
                      {formatDate(doc.createdAt)}
                    </p>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-dark font-bold hover:underline mt-2 inline-block"
                      >
                        Abrir documento
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-primary/5 rounded-brand p-5">
            <p className="text-sm font-semibold text-txt mb-2">
              Como usar este espaço
            </p>
            <ul className="text-xs text-txt-light space-y-1.5">
              <li>📝 Consulte aqui as tarefas e lembretes combinados em sessão.</li>
              <li>🌿 Retome exercícios antes da próxima consulta.</li>
              <li>📄 Declarações e relatórios também aparecerão nesta área.</li>
            </ul>
          </div>

          <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
            <p className="text-sm font-semibold text-txt mb-2">
              Precisa solicitar um documento?
            </p>
            <p className="text-xs text-txt-muted mb-4">
              Você pode pedir declaração de comparecimento, relatório ou encaminhamento.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="https://wa.me/?text=Ol%C3%A1! Preciso solicitar um documento."
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brand-primary text-sm"
              >
                Solicitar via WhatsApp 💬
              </a>
              <Link href="/portal" className="btn-brand-outline text-sm">
                Voltar ao Início
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-primary/5 rounded-brand p-5 mt-6">
        <p className="text-sm font-semibold text-txt mb-2">
          ℹ️ Itens que podem aparecer aqui
        </p>
        <ul className="text-xs text-txt-light space-y-1.5">
          <li>📝 Notas pós-sessão e orientações práticas</li>
          <li>📋 Declaração de comparecimento</li>
          <li>📊 Relatório de acompanhamento</li>
          <li>🔄 Encaminhamento profissional</li>
        </ul>
      </div>
    </div>
  );
}
