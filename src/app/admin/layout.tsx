"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SessionProvider } from "next-auth/react";
import { SessionMismatch } from "@/components/SessionMismatch";

function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
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

  if (session?.user?.role === "patient") {
    return (
      <SessionMismatch
        userName={session.user.name || "Paciente"}
        userEmail={session.user.email || ""}
        userRole="patient"
        targetArea="admin"
      />
    );
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
