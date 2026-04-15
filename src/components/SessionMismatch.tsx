"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface SessionMismatchProps {
  userName: string;
  userEmail: string;
  userRole: string;
  targetArea: "admin" | "portal";
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administradora",
  therapist: "Terapeuta",
  patient: "Paciente",
};

export function SessionMismatch({ userName, userEmail, userRole, targetArea }: SessionMismatchProps) {
  const roleLabel = ROLE_LABELS[userRole] || userRole;
  const isPatientInAdmin = targetArea === "admin";

  const correctPath = isPatientInAdmin ? "/portal" : "/admin";
  const correctLabel = isPatientInAdmin ? "Portal do Paciente" : "Painel Administrativo";
  const areaLabel = targetArea === "admin" ? "Painel Administrativo" : "Portal do Paciente";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-2xl font-bold mx-auto mb-6">
          Ψ
        </div>

        <div className="bg-white rounded-brand p-8 shadow-md">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
            🔒
          </div>

          <h2 className="font-heading text-xl font-bold text-txt mb-2">
            Sessão Ativa
          </h2>

          <p className="text-sm text-txt-light mb-1">
            Você está logado(a) como:
          </p>
          <p className="text-sm font-bold text-txt mb-1">
            {userName}
          </p>
          <p className="text-xs text-txt-muted mb-4">
            {userEmail} · {roleLabel}
          </p>

          <p className="text-sm text-txt-light mb-6">
            O <strong>{areaLabel}</strong> não está disponível para o seu perfil atual.
          </p>

          <div className="space-y-3">
            <Link
              href={correctPath}
              className="btn-brand-primary w-full justify-center flex items-center"
            >
              Ir para {correctLabel} →
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm text-sm font-medium text-txt hover:bg-bg transition-colors"
            >
              🔄 Trocar de Conta
            </button>
          </div>
        </div>

        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-brand-sm p-4 text-left">
          <p className="text-xs text-blue-800 font-bold mb-1">💡 Dica</p>
          <p className="text-xs text-blue-700">
            O navegador permite apenas <strong>uma sessão ativa por vez</strong>.
            Para usar duas contas ao mesmo tempo, abra uma{" "}
            <strong>janela anônima</strong> (Ctrl+Shift+N) para a segunda conta.
          </p>
        </div>
      </div>
    </div>
  );
}
