"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

function SuperAuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.isSuperAdmin) {
      router.push("/admin");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-xl font-bold mx-auto mb-4 animate-pulse">
            M
          </div>
          <p className="text-sm text-txt-muted">Carregando…</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated" || !session?.user?.isSuperAdmin) return null;

  return <>{children}</>;
}

function SuperSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-border flex flex-col z-30">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-sm font-semibold text-txt">MenteVive</p>
            <p className="text-xs text-purple-400">Super Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/super"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-txt-muted hover:text-txt hover:bg-bg transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/super/tenants"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-txt-muted hover:text-txt hover:bg-bg transition-colors"
        >
          Consultórios
        </Link>
        <Link
          href="/super/cdkeys"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-txt-muted hover:text-txt hover:bg-bg transition-colors"
        >
          CDKeys
        </Link>
      </nav>
      <div className="p-4 border-t border-border">
        <Link href="/admin" className="text-xs text-txt-muted hover:text-txt transition-colors">
          ← Voltar ao Admin
        </Link>
      </div>
    </aside>
  );
}

export default function SuperLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SuperAuthGuard>
        <div className="min-h-screen bg-bg flex">
          <SuperSidebar />
          <main className="flex-1 p-6 md:p-8 ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </SuperAuthGuard>
    </SessionProvider>
  );
}
