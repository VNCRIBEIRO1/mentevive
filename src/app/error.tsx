"use client";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-2xl font-bold mx-auto mb-6">
          Ψ
        </div>
        <h2 className="font-heading text-xl font-bold text-txt mb-2">
          Ops, algo deu errado
        </h2>
        <p className="text-sm text-txt-muted mb-6">
          Desculpe pelo inconveniente. Por favor, tente novamente ou entre em contato pelo WhatsApp se o problema persistir.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-primary text-white rounded-brand-sm text-sm font-bold hover:bg-primary-dark transition-colors"
          >
            Tentar Novamente
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border-[1.5px] border-primary/15 rounded-brand-sm text-sm text-txt hover:bg-bg transition-colors"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
