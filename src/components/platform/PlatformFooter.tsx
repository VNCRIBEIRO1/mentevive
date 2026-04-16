import Link from "next/link";

const productLinks = [
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
];

const legalLinks = [
  { label: "Termos de Uso", href: "/termos" },
  { label: "Privacidade", href: "/privacidade" },
];

export function PlatformFooter() {
  return (
    <footer className="border-t border-foreground/5 py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
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
            Tecnologia para saúde mental.
            <br />
            Seu consultório online, completo e seguro.
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
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-foreground/5 text-center">
        <p className="text-xs text-foreground/40">
          © {new Date().getFullYear()} MenteVive. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
