import Link from "next/link";
import { Smartphone, Camera, Music } from "lucide-react";
import { WHATSAPP_LINK, INSTAGRAM_URL, TIKTOK_URL } from "@/lib/utils";

const siteLinks = [
  { href: "#jornada", label: "Jornada" },
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#agendamento", label: "Agendar" },
  { href: "#blog", label: "Blog" },
  { href: "#contato", label: "Contato" },
];

export function Footer() {
  return (
    <footer className="bg-txt text-white/60 py-14 px-4 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[1100px] mx-auto">
        <div>
          <h4 className="text-white font-heading text-base mb-3">MenteVive</h4>
          <p className="text-sm leading-relaxed">Psicóloga Clínica · CRP 06/173961</p>
          <p className="text-[0.7rem] opacity-60 mt-1">UNOESTE · Cert. Transtorno Ansioso e Depressivo — Albert Einstein</p>
          <p className="mt-3 text-[0.7rem] opacity-40">
            Especialista no emocional de quem vive da internet. +3.500 atendimentos realizados. Escuta sensível, ética e profundidade — sem pressa, sem moldes, sem máscaras.
          </p>
        </div>
        <div>
          <h4 className="text-white font-heading text-base mb-3">Links</h4>
          <ul className="space-y-1">
            {siteLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm hover:text-primary-light transition-colors">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-heading text-base mb-3">Contato</h4>
          <ul className="space-y-2">
            <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener" className="text-sm hover:text-primary-light transition-colors flex items-center gap-2"><Smartphone className="w-3.5 h-3.5" /> (11) 98884-0525</a></li>
            <li><a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="text-sm hover:text-primary-light transition-colors flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> Instagram</a></li>
            <li><a href={TIKTOK_URL} target="_blank" rel="noopener" className="text-sm hover:text-primary-light transition-colors flex items-center gap-2"><Music className="w-3.5 h-3.5" /> TikTok</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 mt-8 pt-4 text-center max-w-[1100px] mx-auto">
        <p className="text-[0.66rem] text-white/30">MenteVive © {new Date().getFullYear()} — Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
