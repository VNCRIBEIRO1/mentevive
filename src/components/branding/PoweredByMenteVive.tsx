/**
 * Subtle attribution shown in tenant-branded layouts (admin sidebar / portal sidebar).
 * Always visible regardless of tenant branding overrides — drives platform growth.
 */
export function PoweredByMenteVive() {
  return (
    <a
      href="https://mentevive.vercel.app"
      target="_blank"
      rel="noopener noreferrer"
      className="block text-center text-[0.6rem] uppercase tracking-[0.18em] text-txt-muted/60 hover:text-txt-muted transition-colors py-2"
    >
      Powered by{" "}
      <span className="font-bold text-txt-muted/80">MenteVive</span>
    </a>
  );
}
