"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

const navLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

const PLATFORM_WA = WHATSAPP_LINK || "https://wa.me/5511988840525";
const whatsappHref = `${PLATFORM_WA}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a MenteVive.")}`;

export function PlatformNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-warm-md py-3" : "bg-transparent py-5"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
            Ψ
          </span>
          <span className="text-xl font-heading font-semibold text-foreground">
            MenteVive
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-brand-primary text-sm px-5 py-2.5 inline-flex items-center gap-2"
          >
            <WhatsAppIcon className="w-4 h-4" />
            Fale conosco
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-foreground/70"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-foreground/70 hover:text-foreground py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-foreground/10" />
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/70 py-2"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-brand-primary text-sm text-center px-5 py-2.5 inline-flex items-center justify-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Fale conosco
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
