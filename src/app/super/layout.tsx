"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { LayoutDashboard, Building2, KeyRound, ArrowLeft } from "lucide-react";

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
  const pathname = usePathname();

  const navItems = [
    { href: "/super", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super/tenants", label: "Consultórios", icon: Building2 },
    { href: "/super/cdkeys", label: "CDKeys", icon: KeyRound },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-30">
      <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-bg-soft" />
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-primary/10 via-primary/20 to-primary/5" />
      <div className="relative z-10 flex flex-col h-full">
        <div className="p-5 border-b border-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center shadow-sm">
              <span className="text-white font-heading text-base font-bold">M</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-txt">MenteVive</p>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-primary-dark">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.82rem] font-medium
                  transition-all duration-200 relative
                  ${isActive
                    ? "bg-primary/10 text-primary-dark shadow-sm"
                    : "text-txt-muted hover:text-txt hover:bg-bg"
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-dark rounded-r-full" />
                )}
                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary-dark" : "text-txt-muted"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-primary/10">
          <Link href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-txt-muted hover:text-primary-dark hover:bg-primary/5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Admin
          </Link>
        </div>
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
