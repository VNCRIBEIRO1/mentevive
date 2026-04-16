"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn, signOut, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TurnstileWidget } from "@/components/TurnstileWidget";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administradora",
  therapist: "Terapeuta",
  patient: "Paciente",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [existingSession, setExistingSession] = useState<{
    name?: string | null;
    email?: string | null;
    role?: string;
  } | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  // Read redirect params (from booking flow via /registro)
  const redirectTo = searchParams.get("redirect") || "";
  const bookingDate = searchParams.get("date") || "";
  const bookingTime = searchParams.get("time") || "";
  const bookingModality = searchParams.get("modality") || "";
  const bookingNotes = searchParams.get("notes") || "";
  const isRegistered = searchParams.get("registered") === "true";
  const hasBooking = !!(bookingDate && bookingTime && redirectTo);
  const tenantSlug = searchParams.get("tenant") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "";

  // Check for existing session on mount
  useEffect(() => {
    getSession().then((s) => {
      if (s?.user) {
        setExistingSession({
          name: s.user.name,
          email: s.user.email,
          role: (s.user as { role?: string }).role,
        });
      }
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await signIn("credentials", {
      email,
      password,
      turnstileToken: formData.get("turnstileToken"),
      website: formData.get("website"),
      tenantSlug,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      return;
    }

    // Redirect based on role + booking flow + tenant selection
    const session = await getSession();
    const user = session?.user as { role?: string; needsTenantSelection?: boolean; membershipRole?: string };

    if (user?.needsTenantSelection) {
      router.push("/select-tenant");
      return;
    }

    const effectiveRole = user?.membershipRole || user?.role;

    if (hasBooking && effectiveRole === "patient") {
      // Build redirect URL with booking params
      const params = new URLSearchParams({
        date: bookingDate,
        time: bookingTime,
        modality: bookingModality,
        ...(bookingNotes ? { notes: bookingNotes } : {}),
      });
      router.push(`${redirectTo}?${params.toString()}`);
    } else if (callbackUrl && callbackUrl.startsWith("/")) {
      // Return to the page they were trying to access before auth redirect
      router.push(callbackUrl);
    } else if (effectiveRole === "patient") {
      router.push("/portal");
    } else {
      router.push("/admin");
    }
    router.refresh();
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao solicitar recuperação.");
      } else {
        setForgotMessage("Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-2xl font-bold">
              M
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold text-txt">Entrar no MenteVive</h1>
          <p className="text-sm text-txt-light mt-1">O portal ideal para paciente e psicólogo</p>
        </div>

        {/* Registration success + booking banner */}
        {isRegistered && hasBooking && (
          <div className="bg-green-50 border border-green-200 rounded-brand p-5 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">✅</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-green-900 mb-1">Conta criada com sucesso!</p>
                <p className="text-xs text-green-700 mb-1">
                  📅 Agendamento: {bookingDate} às {bookingTime} • Online
                </p>
                <p className="text-xs text-green-600">
                  Faça login abaixo para finalizar seu agendamento.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRegistered && !hasBooking && (
          <div className="bg-green-50 border border-green-200 rounded-brand p-4 mb-5 text-center">
            <p className="text-sm font-bold text-green-800">✅ Conta criada com sucesso!</p>
            <p className="text-xs text-green-600 mt-1">Faça login para acessar o portal.</p>
          </div>
        )}

        {/* Existing session banner */}
        {existingSession && !checkingSession && (
          <div className="bg-amber-50 border border-amber-200 rounded-brand p-5 mb-5">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-900 mb-1">Você já está logado(a)</p>
                <p className="text-xs text-amber-800 mb-0.5">
                  <strong>{existingSession.name}</strong> · {ROLE_LABELS[existingSession.role || ""] || existingSession.role}
                </p>
                <p className="text-xs text-amber-700 truncate">{existingSession.email}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => {
                      const path = existingSession.role === "patient" ? "/portal" : "/admin";
                      router.push(path);
                    }}
                    className="btn-brand-primary text-xs py-1.5 px-3"
                  >
                    Continuar →
                  </button>
                  <button
                    onClick={async () => {
                      await signOut({ redirect: false });
                      setExistingSession(null);
                    }}
                    className="text-xs py-1.5 px-3 border border-amber-300 rounded-brand-sm text-amber-900 hover:bg-amber-100 transition-colors"
                  >
                    🔄 Trocar de Conta
                  </button>
                </div>
                <p className="text-[0.65rem] text-amber-600 mt-2">
                  Fazer login abaixo substituirá a sessão atual.
                </p>
              </div>
            </div>
          </div>
        )}

        {checkingSession ? (
          <div className="bg-white rounded-brand p-8 shadow-md text-center">
            <p className="text-sm text-txt-muted">Verificando sessão…</p>
          </div>
        ) : showForgot ? (
          <form onSubmit={handleForgotPassword} className="bg-white rounded-brand p-8 shadow-md space-y-5">
            <div className="text-center mb-2">
              <h2 className="font-heading text-lg font-bold text-txt">Recuperar Senha</h2>
              <p className="text-xs text-txt-light mt-1">Informe seu e-mail para receber o link de redefinição</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">
                {error}
              </div>
            )}

            {forgotMessage && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-brand-sm">
                {forgotMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1.5">E-mail</label>
              <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>

            <button type="submit" disabled={forgotLoading}
              className="btn-brand-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
              {forgotLoading ? "Enviando…" : "Enviar Link de Recuperação"}
            </button>

            <p className="text-center text-sm text-txt-light">
              <button type="button" onClick={() => { setShowForgot(false); setError(""); setForgotMessage(""); }}
                className="text-primary-dark font-bold hover:underline">
                ← Voltar ao login
              </button>
            </p>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-brand p-8 shadow-md space-y-5">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-brand-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1.5">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5">Senha</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
          </div>

          <TurnstileWidget />

          <div className="text-right">
            <button type="button" onClick={() => { setShowForgot(true); setError(""); setForgotEmail(email); }}
              className="text-xs text-primary-dark hover:underline">
              Esqueci minha senha
            </button>
          </div>

          <button type="submit" disabled={loading}
            className="btn-brand-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Entrando…" : "Entrar 🌿"}
          </button>

          <p className="text-center text-sm text-txt-light">
            Não tem conta?{" "}
            <Link href="/registro" className="text-primary-dark font-bold hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
        )}

        <p className="text-center text-xs text-txt-muted mt-6">
          MenteVive — Plataforma para Psicólogos e Pacientes
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-sm text-txt-muted">Carregando…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
