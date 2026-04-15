"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Leaf } from "lucide-react";
import Link from "next/link";

const navLinks = [
  { href: "#jornada", label: "Jornada" },
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#agendamento", label: "Agendar" },
  { href: "#blog", label: "Blog" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <a href="#main" className="absolute -top-full left-4 bg-primary text-white px-6 py-3 rounded-b-lg z-[200] focus:top-0">
        Pular para o conteúdo
      </a>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] px-4 md:px-8 py-3 flex items-center justify-between transition-all duration-300
        ${scrolled ? "bg-white/90 shadow-warm-md backdrop-blur-2xl" : "bg-[#FFF5EE]/80 backdrop-blur-xl"} border-b border-primary/5`}
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-teal rounded-full flex items-center justify-center text-white font-heading text-xl font-bold shadow-warm-sm group-hover:shadow-teal-glow transition-shadow duration-300">
            Ψ
          </div>
          <div>
            <span className="font-heading text-lg font-semibold text-txt block leading-tight">Psicolobia</span>
            <span className="text-[0.6rem] text-txt-muted block">Beatriz · Psicóloga Clínica</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-semibold text-txt-light hover:text-teal-dark transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-teal after:transition-all hover:after:w-full">
              {l.label}
            </a>
          ))}
          <Link href="/login" className="text-sm font-semibold text-teal-dark hover:text-primary transition-colors">
            Entrar
          </Link>
          <a href="#agendamento" className="btn-brand-primary text-xs !py-2 !px-4">
            <Leaf className="w-3.5 h-3.5" /> Agendar
          </a>
        </nav>

        <button className="lg:hidden p-2 rounded-lg hover:bg-primary/5 transition-colors" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          <Menu className="w-5 h-5 text-txt" />
        </button>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-[#FFF5EE]/98 backdrop-blur-2xl z-[200] flex flex-col items-center justify-center gap-6"
          >
            <button className="absolute top-6 right-6 p-2 rounded-lg hover:bg-primary/10 transition-colors" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
              <X className="w-6 h-6 text-txt" />
            </button>
            {navLinks.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 120, damping: 20 }}
                className="font-heading text-xl hover:text-teal-dark transition-colors"
              >
                {l.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: navLinks.length * 0.06 }}
            >
              <Link href="/login" onClick={() => setMobileOpen(false)} className="font-heading text-xl text-teal-dark">
                Entrar
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
