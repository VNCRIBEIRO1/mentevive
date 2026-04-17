"use client";
import { useState, useEffect } from "react";

export default function ConsentimentoPage() {
  const [accepted, setAccepted] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/portal/consent")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAccepted(d.consentAcceptedAt); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAccept() {
    if (!checked) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/consent", { method: "POST" });
      if (res.ok) {
        setAccepted(new Date().toISOString());
      }
    } catch { /* */ }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-heading text-2xl font-bold text-txt mb-2">Termos de Consentimento</h1>
      <p className="text-sm text-txt-light mb-6">Termo de Consentimento para Atendimento Psicológico e Tratamento de Dados (LGPD)</p>

      {accepted ? (
        <div className="bg-green-50 border border-green-200 rounded-brand p-6">
          <p className="text-green-800 font-medium">✅ Você aceitou os termos em {new Date(accepted).toLocaleDateString("pt-BR")}.</p>
          <p className="text-sm text-green-700 mt-2">Caso tenha dúvidas, entre em contato com seu/sua psicólogo(a).</p>
        </div>
      ) : (
        <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5 space-y-4">
          <div className="prose prose-sm max-h-80 overflow-y-auto border border-primary/10 rounded-brand p-4 text-txt-light">
            <h3>1. Consentimento para Atendimento Psicológico</h3>
            <p>Eu, paciente identificado(a) no cadastro desta plataforma, declaro que estou ciente e de acordo com o atendimento psicológico realizado pelo(a) profissional responsável por este consultório, na modalidade online (videochamada) ou presencial, conforme agendamento.</p>

            <h3>2. Sigilo Profissional</h3>
            <p>O sigilo profissional é garantido conforme o Código de Ética Profissional do Psicólogo (Resolução CFP nº 010/2005). As informações compartilhadas durante as sessões são confidenciais e só serão compartilhadas mediante autorização expressa ou nas exceções previstas em lei.</p>

            <h3>3. Tratamento de Dados Pessoais (LGPD)</h3>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), informamos que:</p>
            <ul>
              <li>Seus dados pessoais (nome, e-mail, telefone, data de nascimento, CPF) são coletados para fins de identificação e prestação do serviço de psicologia.</li>
              <li>Registros clínicos (prontuários) são mantidos em sigilo e utilizados exclusivamente para o acompanhamento terapêutico.</li>
              <li>Dados financeiros são processados para gestão de pagamentos e emissão de recibos.</li>
              <li>Nenhum dado será compartilhado com terceiros sem consentimento, exceto por obrigação legal.</li>
              <li>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.</li>
            </ul>

            <h3>4. Atendimento Online</h3>
            <p>As sessões online são realizadas por videochamada segura. É responsabilidade do paciente garantir um ambiente privado e com boa conexão de internet durante o atendimento.</p>

            <h3>5. Cancelamento e Remarcação</h3>
            <p>Cancelamentos devem ser realizados com no mínimo 24 horas de antecedência. Faltas sem aviso prévio (no-show) poderão ser cobradas.</p>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-primary/30 text-primary focus:ring-primary"
            />
            <span className="text-sm text-txt">Li e aceito os termos de consentimento para atendimento psicológico e tratamento dos meus dados pessoais.</span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!checked || submitting}
            className="btn-brand-primary w-full disabled:opacity-40"
          >
            {submitting ? "Salvando..." : "Aceitar Termos"}
          </button>
        </div>
      )}
    </div>
  );
}
