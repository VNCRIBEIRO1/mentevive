import Link from "next/link";
import { WHATSAPP_LINK } from "@/lib/utils";
import { WhatsAppIcon } from "./WhatsAppIcon";

const productLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

const legalLinks = [
  { label: "Termos de Uso", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
];

const whatsappHref = WHATSAPP_LINK
  ? `${WHATSAPP_LINK}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre a MenteVive.")}`
  : "";

export function PlatformFooter() {
  return (
    <footer className="border-t border-foreground/5 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-2 mb-3">
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">
              Ψ
            </span>
            <span className="text-lg font-heading font-semibold text-foreground">
              MenteVive
            </span>
          </Link>
          <p className="text-sm text-foreground/50 leading-relaxed">
            Criamos seu consultório online.
            <br />
            Profissional, integrado e seguro.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Produto</h4>
          <ul className="space-y-2">
            {productLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Legal</h4>
          <ul className="space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-foreground/50 hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Contato</h4>
          <ul className="space-y-2">
            {whatsappHref && (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-foreground/50 hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </li>
            )}
            <li>
              <Link
                href="/login"
                className="text-sm text-foreground/50 hover:text-foreground transition-colors"
              >
                Área do profissional
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-foreground/5 text-center">
        <p className="text-xs text-foreground/40">
          © {new Date().getFullYear()} MenteVive. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
