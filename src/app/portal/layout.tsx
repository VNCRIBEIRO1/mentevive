"use client";
import { useSession, SessionProvider } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { SessionMismatch } from "@/components/SessionMismatch";
import {
  Home, CalendarPlus, Leaf, CalendarCheck, Sprout,
  CreditCard, FileText, ShieldCheck, Settings, LogOut,
  ArrowLeft, Menu, X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/portal", label: "Início", icon: Home, group: "main" },
  { href: "/portal/agendar", label: "Agendar Sessão", icon: CalendarPlus, group: "main" },
  { href: "/portal/processo", label: "Processo Terapêutico", icon: Leaf, group: "main" },
  { href: "/portal/sessoes", label: "Minhas Sessões", icon: CalendarCheck, group: "therapy" },
  { href: "/portal/evolucao", label: "Minha Evolução", icon: Sprout, group: "therapy" },
  { href: "/portal/pagamentos", label: "Pagamentos", icon: CreditCard, group: "account" },
  { href: "/portal/documentos", label: "Notas e Docs", icon: FileText, group: "account" },
  { href: "/portal/consentimento", label: "Termos LGPD", icon: ShieldCheck, group: "account" },
  { href: "/portal/configuracoes", label: "Configurações", icon: Settings, group: "account" },
];

const GROUP_LABELS: Record<string, string> = {
  main: "Portal",
  therapy: "Terapia",
  account: "Conta",
};

function PortalSidebar({ mobileOpen, onClose, userName, userEmail, tenantName }: { mobileOpen: boolean; onClose: () => void; userName?: string; userEmail?: string; tenantName?: string }) {
  const pathname = usePathname();
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const groups = ["main", "therapy", "account"];

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 flex flex-col
        transition-transform duration-300 ease-out
        lg:static lg:translate-x-0 lg:z-auto
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Sidebar gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-bg-soft" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-primary/10 via-primary/20 to-primary/5" />

        <div className="relative z-10 flex flex-col h-full px-5 py-6">
          {/* Logo + close button */}
          <div className="flex items-center justify-between mb-7">
            <Link href="/portal" className="flex items-center gap-2.5 group" onClick={onClose}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center shadow-sm">
                <Leaf className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-heading text-lg font-bold text-txt group-hover:text-teal-dark transition-colors">
                {tenantName || "MenteVive"}
              </span>
            </Link>
            <button onClick={onClose} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Avatar card */}
          {userName && (
            <div className="mb-6 p-3.5 rounded-xl bg-gradient-to-r from-teal/8 to-primary/8 border border-teal/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal to-primary flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-txt truncate">{userName}</p>
                  <p className="text-[0.65rem] text-txt-muted truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation groups */}
          <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin">
            {groups.map((group) => {
              const items = NAV_ITEMS.filter((i) => i.group === group);
              return (
                <div key={group}>
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-txt-muted/70 mb-1.5 px-3">
                    {GROUP_LABELS[group]}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((item) => {
                      const isActive = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onClose}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.82rem] font-medium
                            transition-all duration-200 group/nav relative
                            ${isActive
                              ? "bg-teal/10 text-teal-dark shadow-sm"
                              : "text-txt-light hover:bg-gray-50 hover:text-txt"
                            }
                          `}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-teal rounded-r-full" />
                          )}
                          <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                            isActive ? "text-teal" : "text-txt-muted group-hover/nav:text-txt-light"
                          }`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Footer actions */}
          <div className="border-t border-primary/10 pt-4 mt-4 space-y-1">
            <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-txt-muted hover:text-primary-dark hover:bg-primary/5 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao site
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <PortalAuthGuard>
        <PortalShell>{children}</PortalShell>
      </PortalAuthGuard>
    </SessionProvider>
  );
}

function PortalAuthGuard({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-teal to-primary flex items-center justify-center shadow-sm animate-pulse">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-txt-muted">Carregando seu portal…</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") return null;

  const effectiveRole = session?.user?.membershipRole || session?.user?.role;
  if (effectiveRole !== "patient") {
    return (
      <SessionMismatch
        userName={session?.user?.name || "Usuário"}
        userEmail={session?.user?.email || ""}
        userRole={effectiveRole || "admin"}
        targetArea="portal"
      />
    );
  }

  return <>{children}</>;
}

function PortalShell({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <a href="#portal-main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[999] focus:bg-teal focus:text-white focus:px-4 focus:py-2 focus:rounded-brand-sm focus:text-sm focus:font-bold">
        Ir para conteúdo
      </a>
      <PortalSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        userName={session?.user?.name || undefined}
        userEmail={session?.user?.email || undefined}
        tenantName={session?.user?.tenantName || undefined}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3.5 bg-card/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="w-9 h-9 rounded-lg flex items-center justify-center text-txt hover:bg-gray-50 transition-colors" aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/portal" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-heading text-base font-bold text-txt">{session?.user?.tenantName || "MenteVive"}</span>
          </Link>
          <div className="w-9" />
        </header>
        <main id="portal-main" className="flex-1 p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
