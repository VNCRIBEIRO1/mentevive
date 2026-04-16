"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { NotificationBell } from "@/components/admin/NotificationBell";

const menuItems = [
  { href: "/admin", icon: "D", label: "Dashboard" },
  { href: "/admin/pacientes", icon: "P", label: "Pacientes" },
  { href: "/admin/agenda", icon: "A", label: "Agenda" },
  { href: "/admin/horarios", icon: "H", label: "Horarios" },
  { href: "/admin/financeiro", icon: "F", label: "Financeiro" },
  { href: "/admin/prontuarios", icon: "R", label: "Prontuarios" },
  { href: "/admin/assinatura", icon: "S", label: "Assinatura" },
  { href: "/admin/configuracoes", icon: "C", label: "Configuracoes" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-primary/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-lg font-bold">
            P
          </div>
          <div>
            <span className="font-heading text-base font-semibold text-txt block leading-tight">{session?.user?.tenantName || "MenteVive"}</span>
            <span className="text-[0.6rem] text-txt-muted block">Painel Administrativo</span>
          </div>
        </Link>
        <NotificationBell />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-brand-sm text-sm font-medium transition-colors ${
                isActive ? "bg-primary/10 text-primary-dark font-bold" : "text-txt-light hover:bg-bg hover:text-txt"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary/10 space-y-2">
        <div className="px-4 py-2">
          <p className="text-xs font-bold text-txt truncate">{session?.user?.name}</p>
          <p className="text-[0.65rem] text-txt-muted truncate">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-brand-sm text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <span>X</span> Sair
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center border border-primary/10"
      >
        <span className="flex flex-col gap-1">
          <span className="w-4 h-0.5 bg-txt rounded-full" />
          <span className="w-4 h-0.5 bg-txt rounded-full" />
          <span className="w-4 h-0.5 bg-txt rounded-full" />
        </span>
      </button>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col z-[71] shadow-xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-xl text-txt-muted hover:text-txt">
              x
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-primary/10 flex-col z-50 hidden md:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
