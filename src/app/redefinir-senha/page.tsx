"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token de recuperação não encontrado. Use o link enviado por e-mail.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-2xl font-bold">
              Ψ
            </div>
          </Link>
          <h1 className="font-heading text-2xl font-bold text-txt">Redefinir Senha</h1>
          <p className="text-sm text-txt-light mt-1">Crie uma nova senha para sua conta</p>
        </div>

        {success ? (
          <div className="bg-card rounded-brand p-8 shadow-md text-center space-y-4">
            <div className="text-4xl">✅</div>
            <h2 className="font-heading text-lg font-bold text-txt">Senha redefinida!</h2>
            <p className="text-sm text-txt-light">
              Sua senha foi alterada com sucesso. Redirecionando para o login…
            </p>
            <Link href="/login" className="btn-brand-primary inline-flex justify-center">
              Ir para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card rounded-brand p-8 shadow-md space-y-5">
            {!token && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-brand-sm">
                Token não encontrado. Use o link enviado por e-mail para redefinir sua senha.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5">Nova Senha</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading || !token}
              className="btn-brand-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Redefinindo…" : "Redefinir Senha 🔒"}
            </button>

            <p className="text-center text-sm text-txt-light">
              <Link href="/login" className="text-primary-dark font-bold hover:underline">
                ← Voltar ao login
              </Link>
            </p>
          </form>
        )}

        <p className="text-center text-xs text-txt-muted mt-6">
          <Link href="/" className="hover:text-primary-dark transition-colors">← Voltar ao site</Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-txt-muted">Carregando…</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
