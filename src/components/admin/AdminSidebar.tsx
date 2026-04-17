"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { NotificationBell } from "@/components/admin/NotificationBell";
import {
  LayoutDashboard, Users, CalendarDays, Clock,
  Wallet, ClipboardList, CreditCard, Settings,
  LogOut, ArrowLeft, Menu, X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", group: "principal" },
  { href: "/admin/pacientes", icon: Users, label: "Pacientes", group: "principal" },
  { href: "/admin/agenda", icon: CalendarDays, label: "Agenda", group: "clinica" },
  { href: "/admin/horarios", icon: Clock, label: "Horários", group: "clinica" },
  { href: "/admin/prontuarios", icon: ClipboardList, label: "Prontuários", group: "clinica" },
  { href: "/admin/financeiro", icon: Wallet, label: "Financeiro", group: "gestao" },
  { href: "/admin/assinatura", icon: CreditCard, label: "Assinatura", group: "gestao" },
  { href: "/admin/configuracoes", icon: Settings, label: "Configurações", group: "gestao" },
];

const GROUP_LABELS: Record<string, string> = {
  principal: "Principal",
  clinica: "Clínica",
  gestao: "Gestão",
};

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = session?.user?.name || "";
  const userEmail = session?.user?.email || "";
  const initials = userName
    ? userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const groups = ["principal", "clinica", "gestao"];

  const sidebarContent = (
    <>
      {/* Logo + Brand */}
      <div className="p-5 border-b border-primary/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
            <span className="text-white font-heading text-base font-bold">Ψ</span>
          </div>
          <span className="font-heading text-lg font-bold text-txt group-hover:text-primary-dark transition-colors">
            {session?.user?.tenantName || "MenteVive"}
          </span>
        </Link>
        <NotificationBell />
      </div>

      {/* Avatar card */}
      {userName && (
        <div className="mx-5 mt-5 mb-2 p-3.5 rounded-xl bg-gradient-to-r from-primary/8 to-accent/8 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-txt truncate">{userName}</p>
              <p className="text-[0.65rem] text-txt-muted truncate">{userEmail}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grouped navigation */}
      <nav className="flex-1 px-5 py-4 space-y-5 overflow-y-auto scrollbar-thin">
        {groups.map((group) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          return (
            <div key={group}>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-txt-muted/70 mb-1.5 px-3">
                {GROUP_LABELS[group]}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-[0.82rem] font-medium
                        transition-all duration-200 group/nav relative
                        ${isActive
                          ? "bg-primary/10 text-primary-dark shadow-sm"
                          : "text-txt-light hover:bg-bg hover:text-txt"
                        }
                      `}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-dark rounded-r-full" />
                      )}
                      <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                        isActive ? "text-primary-dark" : "text-txt-muted group-hover/nav:text-txt-light"
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
      <div className="border-t border-primary/10 px-5 pt-4 pb-5 space-y-1">
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-txt-muted hover:text-primary-dark hover:bg-primary/5 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors w-full text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-card/80 backdrop-blur-md rounded-lg shadow-warm-sm flex items-center justify-center border border-primary/10"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-txt" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-card flex flex-col z-[71] shadow-xl transition-transform duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-txt-muted hover:text-txt hover:bg-gray-100 transition-colors"
              aria-label="Fechar menu"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 flex-col z-50 hidden md:flex">
        <div className="absolute inset-0 bg-gradient-to-b from-card via-card to-bg-soft" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-primary/10 via-primary/20 to-primary/5" />
        <div className="relative z-10 flex flex-col h-full">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
}
