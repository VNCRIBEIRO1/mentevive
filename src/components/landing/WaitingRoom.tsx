"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export function WaitingRoom() {
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(900);
  const [ready, setReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setStarted(true);
    setReady(false);
    setSeconds(900);
  };

  useEffect(() => {
    if (!started) return;
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [started]);

  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");

  return (
    <section className="py-20 px-4 md:px-8 bg-white" id="sala-espera">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="section-label justify-center flex">Sala de Espera Virtual</div>
        <h2 className="section-title">Prepare-se para sua Sessão</h2>
        <p className="text-txt-light max-w-[520px] mx-auto text-sm">
          Um espaço virtual para você se preparar emocionalmente antes de iniciar sua sessão online.
        </p>
      </div>

      <div className="max-w-[650px] mx-auto mt-8 bg-bg rounded-brand p-10 shadow-md text-center">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-4
          ${ready ? "bg-green-100 text-green-600 border border-green-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"}`}>
          {ready ? "✅ Pronto! Pode entrar na sessão." : started ? "⏳ Aguardando… Respire fundo" : "⏳ Aguardando sua sessão"}
        </div>

        <div className="font-heading text-5xl font-bold text-primary-dark my-4">
          {started ? `${m}:${s}` : "--:--"}
        </div>

        <p className="text-sm text-txt-light mb-6 leading-relaxed">
          {ready
            ? "Sua psicóloga está te esperando. Clique no botão abaixo para entrar na sessão."
            : started
            ? "Sua sessão começará em breve. Aproveite este momento para se acalmar e se preparar."
            : "Clique em \"Iniciar Espera\" quando estiver a 15 minutos da sua sessão."}
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          {!started && !ready && (
            <button onClick={start} className="btn-brand-primary">🌿 Iniciar Espera</button>
          )}
          {ready && (
            <Link href="/portal/sessoes" className="btn-brand-accent">
              📹 Acessar Sala de Sessão
            </Link>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-primary/15">
          <h4 className="font-heading text-sm font-semibold mb-3">🧘 Enquanto Espera…</h4>
          {[
            "🌬️ Faça 3 respirações profundas — inspire em 4s, expire em 6s",
            "📱 Coloque seu celular no silencioso",
            "💧 Tenha um copo de água ao alcance",
            "🪑 Acomode-se em um lugar tranquilo e confortável",
            "📝 Se quiser, anote o que gostaria de compartilhar hoje",
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-txt-light mb-1.5">
              {tip}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
