import { AnimatedSection } from "@/components/landing";
import { WHATSAPP_LINK } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

const PLATFORM_WA = WHATSAPP_LINK || "https://wa.me/5511988840525";
const whatsappHref = `${PLATFORM_WA}?text=${encodeURIComponent("Olá! Quero começar com a MenteVive.")}`;

export function PlatformCTA() {
  return (
    <section className="py-20 px-6">
      <AnimatedSection direction="scale">
        <div className="max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-primary/90 to-teal/90 p-12 sm:p-16 text-center relative overflow-hidden">
          {/* subtle noise overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20viewBox%3D%220%200%20256%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20baseFrequency%3D%220.65%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noise)%22%2F%3E%3C%2Fsvg%3E')]" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white leading-tight">
              Pronto para ter seu consultório online?
            </h2>
            <p className="mt-4 text-white/80 text-lg max-w-lg mx-auto">
              Fale conosco pelo WhatsApp e tenha seu site profissional pronto com a plataforma completa.
            </p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 bg-white text-foreground font-semibold px-8 py-3.5 rounded-brand shadow-warm-lg hover:shadow-warm-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              <WhatsAppIcon className="w-5 h-5" />
              Fale conosco agora
            </a>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
