"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-20 px-4">
      <div className="text-center max-w-md">
        <span className="text-4xl">😟</span>
        <h2 className="font-heading text-lg font-bold text-txt mt-4 mb-2">
          Erro ao carregar a página
        </h2>
        <p className="text-sm text-txt-muted mb-6">
          Ocorreu um erro inesperado. Por favor, tente novamente.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-brand-primary text-sm"
          >
            Tentar Novamente
          </button>
          <a href="/admin" className="btn-brand-outline text-sm">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
