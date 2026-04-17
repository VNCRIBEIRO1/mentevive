"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SessionProvider } from "next-auth/react";
import { SessionMismatch } from "@/components/SessionMismatch";
import { Clock } from "lucide-react";

interface SubscriptionStatus {
  plan: string;
  isTrialExpired: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  hasSubscription: boolean;
  subscriptionStatus: string | null;
}

function TrialExpiredOverlay() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-primary/10 rounded-brand p-8 text-center shadow-warm-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-heading font-bold text-txt mb-2">
          Período de teste encerrado
        </h2>
        <p className="text-sm text-txt-muted mb-6">
          Seu período de teste gratuito expirou. Para continuar utilizando o
          sistema, assine um dos nossos planos.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push("/admin/assinatura")}
            className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition"
          >
            Ver planos — a partir de R$ 59,90/mês
          </button>
          <p className="text-xs text-txt-muted">
            ou R$ 499,00/ano (economia de R$ 219,80)
          </p>
        </div>
      </div>
    </div>
  );
}

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch subscription status once authenticated
  useEffect(() => {
    if (status !== "authenticated") return;
    const effectiveRole = session?.user?.membershipRole || session?.user?.role;
    // Skip subscription check for patients (they'll be redirected) and super admins
    if (effectiveRole === "patient" || session?.user?.isSuperAdmin) {
      setSubLoading(false);
      return;
    }

    fetch("/api/admin/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSubStatus(data);
      })
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, [status, session]);

  if (status === "loading" || (status === "authenticated" && subLoading)) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-xl font-bold mx-auto mb-4 animate-pulse">
            Ψ
          </div>
          <p className="text-sm text-txt-muted">Carregando…</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  const effectiveRole = session?.user?.membershipRole || session?.user?.role;
  if (effectiveRole === "patient") {
    return (
      <SessionMismatch
        userName={session.user.name || "Paciente"}
        userEmail={session.user.email || ""}
        userRole="patient"
        targetArea="admin"
      />
    );
  }

  // Allow subscription page even when trial expired (so they can subscribe)
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isSubscriptionPage = pathname.startsWith("/admin/assinatura");

  // Block access if trial expired and no active subscription
  if (
    subStatus?.isTrialExpired &&
    !subStatus.hasSubscription &&
    subStatus.subscriptionStatus !== "active" &&
    !isSubscriptionPage &&
    !session?.user?.isSuperAdmin
  ) {
    return <TrialExpiredOverlay />;
  }

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminAuthGuard>
        <div className="min-h-screen bg-bg flex">
          <AdminSidebar />
          <main className="flex-1 p-6 md:p-8 ml-0 md:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </AdminAuthGuard>
    </SessionProvider>
  );
}
