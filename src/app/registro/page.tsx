"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

/**
 * Read booking PII from sessionStorage (set by landing page Scheduling).
 * Called once at module-level during hydration — no setState in effect needed.
 */
function readBookingFromStorage(): { name: string; email: string; phone: string; notes: string } {
  const empty = { name: "", email: "", phone: "", notes: "" };
  if (typeof window === "undefined") return empty;
  try {
    const raw = sessionStorage.getItem("booking");
    if (!raw) return empty;
    const data = JSON.parse(raw) as Record<string, string>;
    sessionStorage.removeItem("booking");
    return {
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      notes: data.notes || "",
    };
  } catch {
    return empty;
  }
}

function RegistroForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read non-sensitive params from URL
  const redirectTo = searchParams.get("redirect") || "";
  const bookingDate = searchParams.get("date") || "";
  const bookingTime = searchParams.get("time") || "";
  const bookingModality = searchParams.get("modality") || "";
  const hasBookingParam = searchParams.get("booking") === "1";
  const tenantSlug = searchParams.get("tenant") || "";
  const typeParam = searchParams.get("type") || "";

  const hasBooking = !!(bookingDate && bookingTime);

  // Read PII from sessionStorage once (secure — never exposed in URL)
  const prefill = useMemo(() => hasBookingParam ? readBookingFromStorage() : { name: "", email: "", phone: "", notes: "" }, [hasBookingParam]);

  const [accountType, setAccountType] = useState<"patient" | "therapist">(
    typeParam === "therapist" ? "therapist" : "patient"
  );
  const [name, setName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [phone, setPhone] = useState(prefill.phone);
  const [bookingNotes] = useState(prefill.notes);
  const [clinicName, setClinicName] = useState("");
  const [crp, setCrp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isTherapist = accountType === "therapist";

  // Sync prefill if it arrives after initial render (SSR → client hydration)
  useEffect(() => {
    if (prefill.name && !name) setName(prefill.name);
    if (prefill.email && !email) setEmail(prefill.email);
    if (prefill.phone && !phone) setPhone(prefill.phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nome é obrigatório.");
      return;
    }

    if (isTherapist && !clinicName.trim()) {
      setError("Nome do consultório é obrigatório.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          accountType,
          ...(isTherapist ? { clinicName: clinicName.trim() } : {}),
          ...(isTherapist && crp ? { crp: crp.trim() } : {}),
          turnstileToken: formData.get("turnstileToken"),
          website: formData.get("website"),
          ...(tenantSlug && !isTherapist ? { tenantSlug } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        setLoading(false);
        return;
      }

      // Therapist: redirect to login with their new tenant slug
      if (isTherapist && data.tenantSlug) {
        const params = new URLSearchParams({
          registered: "true",
          email: email,
          tenant: data.tenantSlug,
        });
        router.push(`/login?${params.toString()}`);
        return;
      }

      // If there's a booking redirect, go to login with booking params
      if (hasBooking && redirectTo) {
        const params = new URLSearchParams({
          registered: "true",
          email: email,
          redirect: redirectTo,
          date: bookingDate,
          time: bookingTime,
          modality: bookingModality,
          ...(bookingNotes ? { notes: bookingNotes } : {}),
          ...(tenantSlug ? { tenant: tenantSlug } : {}),
        });
        router.push(`/login?${params.toString()}`);
      } else {
        const params = new URLSearchParams({
          registered: "true",
          email: email,
          ...(tenantSlug ? { tenant: tenantSlug } : {}),
        });
        router.push(`/login?${params.toString()}`);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-2xl font-bold">
            Ψ
          </div>
        </Link>
        <h1 className="font-heading text-2xl font-bold text-txt">Criar Conta</h1>
        <p className="text-sm text-txt-light mt-1">
          {hasBooking
            ? "Crie sua conta para finalizar o agendamento"
            : isTherapist
            ? "Crie sua conta profissional no MenteVive"
            : "Registre-se para acessar o portal do paciente"}
        </p>
      </div>

      {/* Account type selector */}
      {!hasBooking && !tenantSlug && (
        <div className="flex gap-3 mb-5">
          <button
            type="button"
            onClick={() => setAccountType("patient")}
            className={`flex-1 py-3 px-4 rounded-brand-sm border-2 text-sm font-bold transition-all ${
              !isTherapist
                ? "border-primary bg-primary/10 text-primary-dark"
                : "border-primary/15 bg-card text-txt-light hover:border-primary/30"
            }`}
          >
            <span className="block text-lg mb-0.5">🧠</span>
            Sou Paciente
          </button>
          <button
            type="button"
            onClick={() => setAccountType("therapist")}
            className={`flex-1 py-3 px-4 rounded-brand-sm border-2 text-sm font-bold transition-all ${
              isTherapist
                ? "border-teal bg-teal/10 text-teal-800"
                : "border-primary/15 bg-card text-txt-light hover:border-primary/30"
            }`}
          >
            <span className="block text-lg mb-0.5">🩺</span>
            Sou Psicólogo(a)
          </button>
        </div>
      )}

      {hasBooking && (
        <div className="bg-green-50 border border-green-200 rounded-brand p-4 mb-5 text-sm">
          <p className="font-bold text-green-800 mb-1">📅 Agendamento selecionado</p>
          <p className="text-green-700">
            {bookingDate} às {bookingTime} • Online
          </p>
          <p className="text-xs text-green-600 mt-1">
            Após criar sua conta e fazer login, o agendamento será finalizado.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card rounded-brand p-8 shadow-md space-y-5">
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
          <label className="block text-xs font-bold mb-1.5">Nome completo</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Telefone / WhatsApp</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        {isTherapist && (
          <>
            <div>
              <label className="block text-xs font-bold mb-1.5">Nome do Consultório / Clínica</label>
              <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)}
                placeholder="Ex: Espaço Mente Viva"
                className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
              <p className="text-xs text-txt-muted mt-1">Será usado para criar seu espaço exclusivo na plataforma.</p>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5">CRP <span className="font-normal text-txt-muted">(opcional)</span></label>
              <input type="text" value={crp} onChange={(e) => setCrp(e.target.value)}
                placeholder="Ex: 06/173961"
                className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold mb-1.5">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <div>
          <label className="block text-xs font-bold mb-1.5">Confirmar senha</label>
          <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a senha"
            className="w-full py-3 px-4 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-card text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>

        <TurnstileWidget />

        <button type="submit" disabled={loading}
          className="btn-brand-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Criando conta…" : hasBooking ? "Criar Conta e Agendar 🌿" : isTherapist ? "Criar Conta Profissional 🩺" : "Criar Conta 🌿"}
        </button>

        <p className="text-center text-sm text-txt-light">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary-dark font-bold hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="text-center">
          <p className="text-sm text-txt-muted">Carregando…</p>
        </div>
      }>
        <RegistroForm />
      </Suspense>
    </div>
  );
}
