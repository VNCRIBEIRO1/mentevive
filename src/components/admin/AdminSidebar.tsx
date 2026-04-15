"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { NotificationBell } from "@/components/admin/NotificationBell";

const menuItems = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/pacientes", icon: "👥", label: "Pacientes" },
  { href: "/admin/agenda", icon: "📅", label: "Agenda" },
  { href: "/admin/horarios", icon: "🕐", label: "Horários" },
  { href: "/admin/financeiro", icon: "💰", label: "Financeiro" },
  { href: "/admin/prontuarios", icon: "📋", label: "Prontuários" },
  { href: "/admin/blog", icon: "✍️", label: "Blog" },
  { href: "/admin/grupos", icon: "🤝", label: "Grupos" },
  { href: "/admin/configuracoes", icon: "⚙️", label: "Configurações" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo + Notifications */}
      <div className="p-6 border-b border-primary/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-lg font-bold">
            Ψ
          </div>
          <div>
            <span className="font-heading text-base font-semibold text-txt block leading-tight">Psicolobia</span>
            <span className="text-[0.6rem] text-txt-muted block">Painel Administrativo</span>
          </div>
        </Link>
        <NotificationBell />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-brand-sm text-sm font-medium transition-colors
                ${isActive ? "bg-primary/10 text-primary-dark font-bold" : "text-txt-light hover:bg-bg hover:text-txt"}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & Actions */}
      <div className="p-4 border-t border-primary/10 space-y-2">
        <Link href="/" className="flex items-center gap-3 px-4 py-2 rounded-brand-sm text-sm text-txt-light hover:bg-bg hover:text-txt transition-colors">
          <span>🌐</span> Ver Site
        </Link>
        <div className="px-4 py-2">
          <p className="text-xs font-bold text-txt truncate">{session?.user?.name}</p>
          <p className="text-[0.65rem] text-txt-muted truncate">{session?.user?.email}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-brand-sm text-sm text-red-500 hover:bg-red-50 transition-colors">
          <span>🚪</span> Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-primary/10">
        <span className="flex flex-col gap-1">
          <span className="w-4 h-0.5 bg-txt rounded-full" />
          <span className="w-4 h-0.5 bg-txt rounded-full" />
          <span className="w-4 h-0.5 bg-txt rounded-full" />
        </span>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col z-[71] shadow-xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-xl text-txt-muted hover:text-txt">✕</button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-primary/10 flex-col z-50 hidden md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
