"use client";
import { useState } from "react";
import { Smartphone, Camera, Music, Monitor, Send, CheckCircle, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WHATSAPP_LINK, INSTAGRAM_URL, TIKTOK_URL } from "@/lib/utils";
import { AnimatedSection, AnimatedItem } from "./AnimatedSection";
import { GlassCard } from "./GlassCard";
import type { ReactNode } from "react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export function Contact() {
  const [toast, setToast] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
          turnstileToken: formData.get("turnstileToken"),
          website: formData.get("website"),
        }),
      });
      if (res.ok) {
        setToast("Mensagem enviada! Retornaremos com carinho em breve");
        form.reset();
      } else {
        setToast("Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.");
      }
    } catch {
      setToast("Erro de conexão. Tente novamente.");
    } finally {
      setSending(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const contacts: { icon: ReactNode; title: string; content: string; href?: string }[] = [
    { icon: <Smartphone className="w-5 h-5 text-teal" />, title: "WhatsApp", content: "(11) 98884-0525", href: WHATSAPP_LINK },
    { icon: <Camera className="w-5 h-5 text-teal" />, title: "Instagram", content: "@psicolobiaa", href: INSTAGRAM_URL },
    { icon: <Music className="w-5 h-5 text-teal" />, title: "TikTok", content: "@psicolobiaa", href: TIKTOK_URL },
    { icon: <Monitor className="w-5 h-5 text-teal" />, title: "Atendimento Online", content: "Terapia por videochamada em todo o Brasil" },
  ];

  return (
    <section className="py-20 px-4 md:px-8 bg-white" id="contato">
      <div className="max-w-[1100px] mx-auto">
        <AnimatedSection direction="up">
          <div className="section-label">Contato</div>
          <h2 className="section-title">Vamos Conversar?</h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10">
          {/* Info cards */}
          <AnimatedSection direction="left" staggerChildren={0.08} staggerType="premium" className="space-y-3">
            {contacts.map((c, i) => (
              <AnimatedItem key={i} direction="left" staggerType="premium">
                <GlassCard className="flex gap-3.5 !p-4">
                  <div className="w-[42px] h-[42px] bg-teal/10 rounded-full flex items-center justify-center shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{c.title}</h4>
                    {c.href ? (
                      <a href={c.href} target="_blank" rel="noopener" className="text-xs text-teal-dark hover:underline">
                        {c.content}
                      </a>
                    ) : (
                      <p className="text-xs text-txt-light">{c.content}</p>
                    )}
                  </div>
                </GlassCard>
              </AnimatedItem>
            ))}
          </AnimatedSection>

          {/* Form */}
          <AnimatedSection direction="right" staggerType="premium">
            <div className="glass-strong rounded-brand p-8">
              <h3 className="font-heading text-lg font-semibold mb-5 flex items-center gap-2">
                <Send className="w-4 h-4 text-teal" /> Mensagem
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div>
                  <label className="block text-xs font-bold mb-1">Nome *</label>
                  <input type="text" name="name" required placeholder="Seu nome"
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">E-mail *</label>
                  <input type="email" name="email" required placeholder="seu@email.com"
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Assunto</label>
                  <select name="subject" className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow">
                    <option>Agendar sessão</option>
                    <option>Grupo terapêutico</option>
                    <option>Terapia de Aceitação e Compromisso (ACT)</option>
                    <option>Dúvida</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Mensagem *</label>
                  <textarea name="message" required placeholder="Como posso te acolher?" rows={3}
                    className="w-full py-2.5 px-3 border-[1.5px] border-primary/15 rounded-brand-sm font-body text-sm bg-white text-txt focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/10 transition-shadow resize-y" />
                </div>
                <TurnstileWidget />
                <button type="submit" disabled={sending} className="btn-brand-primary w-full justify-center">
                  {sending ? "Enviando…" : <><Leaf className="w-4 h-4" /> Enviar com Carinho</>}
                </button>
              </form>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Toast with glow-pulse */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-teal text-white px-8 py-4 rounded-brand-sm font-bold z-[300] shadow-teal-glow text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
