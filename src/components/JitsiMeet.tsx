"use client";
import { useEffect, useRef, useState } from "react";
import { JITSI_DOMAIN, jitsiConfig, jitsiInterfaceConfig } from "@/lib/jitsi-config";

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  onClose?: () => void;
}

export function JitsiMeet({ roomName, displayName, onClose }: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    addEventListener: (event: string, callback: () => void) => void;
    dispose: () => void;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;

    const options = {
      roomName,
      parentNode: containerRef.current,
      width: "100%",
      height: "100%",
      configOverwrite: jitsiConfig,
      interfaceConfigOverwrite: jitsiInterfaceConfig,
      userInfo: {
        displayName,
      },
    };

    // Load Jitsi External API script
    const script = document.createElement("script");
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => {
      try {
        if (!window.JitsiMeetExternalAPI) {
          throw new Error("Jitsi external API indisponível.");
        }

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
        apiRef.current = api;
        setLoading(false);

        api.addEventListener("readyToClose", () => {
          onClose?.();
        });

        api.addEventListener("videoConferenceLeft", () => {
          onClose?.();
        });
      } catch {
        setError("Erro ao iniciar a videochamada. Tente novamente.");
        setLoading(false);
      }
    };
    script.onerror = () => {
      setError("Erro ao carregar o serviço de videochamada.");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch { /* already disposed */ }
        apiRef.current = null;
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomName, displayName, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] m-4 rounded-brand overflow-hidden bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-txt text-white">
          <span className="text-sm font-bold">🧠 Sessão Online</span>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-sm font-bold"
          >
            ✕ Fechar
          </button>
        </div>

        {/* Content */}
        <div ref={containerRef} className="w-full" style={{ height: "calc(100% - 40px)" }}>
          {loading && (
            <div className="flex items-center justify-center h-full bg-bg">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-heading text-xl font-bold mx-auto mb-4 animate-pulse">
                  Ψ
                </div>
                <p className="text-sm text-txt-muted">Conectando à sessão…</p>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center justify-center h-full bg-bg">
              <div className="text-center">
                <p className="text-red-500 text-sm mb-4">{error}</p>
                <button onClick={onClose} className="btn-brand-outline text-sm">
                  Voltar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
