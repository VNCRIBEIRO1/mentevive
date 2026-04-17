"use client";
import { useState } from "react";

export default function PortalConfiguracoesPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/portal/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao alterar senha.");
      } else {
        setSuccess("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-txt">Configurações</h1>
        <p className="text-sm text-txt-light mt-1">Gerencie sua conta e preferências</p>
      </div>

      {/* Change Password */}
      <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
        <h2 className="font-heading text-lg font-bold text-txt mb-4">🔒 Alterar Senha</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm mb-4" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-brand-sm mb-4" role="status">
            {success}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5">Senha Atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Confirmar Nova Senha</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Alterando…" : "Alterar Senha"}
          </button>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-card rounded-brand p-6 shadow-sm border border-primary/5">
        <h2 className="font-heading text-lg font-bold text-txt mb-3">ℹ️ Informações</h2>
        <p className="text-sm text-txt-light">
          Para alterar outros dados do seu perfil (nome, telefone, etc.), entre em contato pelo WhatsApp.
        </p>
        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm text-primary-dark hover:underline font-bold"
        >
          💬 Enviar WhatsApp
        </a>
      </div>
    </div>
  );
}
