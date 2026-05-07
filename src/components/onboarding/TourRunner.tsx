"use client";

import { useEffect, useState, useCallback } from "react";
import { Joyride, STATUS, type Step, type EventData } from "react-joyride";
import { useBranding } from "@/components/branding/BrandingContext";

type TourRunnerProps = {
  /** localStorage key used to remember completion. Bump suffix to force re-run. */
  storageKey: string;
  /** Steps shown by Joyride. Use `target: '[data-tour="…"]'` to attach to DOM nodes. */
  steps: Step[];
  /**
   * If true, the tour starts as soon as the component mounts (only the first time —
   * subsequent visits are silent because of the localStorage flag).
   */
  autoStartOnFirstVisit?: boolean;
};

/** Window-scoped relauncher used by HelpButton. */
const RELAUNCH_EVENT = "mv:tour:relaunch";

export function relaunchTour(storageKey: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
  window.dispatchEvent(new CustomEvent(RELAUNCH_EVENT, { detail: { storageKey } }));
}

export function TourRunner({ storageKey, steps, autoStartOnFirstVisit = true }: TourRunnerProps) {
  const branding = useBranding();
  const [run, setRun] = useState(false);

  // Auto-launch on first visit
  useEffect(() => {
    if (!autoStartOnFirstVisit) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const t = setTimeout(() => setRun(true), 600);
      return () => clearTimeout(t);
    }
  }, [autoStartOnFirstVisit, storageKey]);

  // Listen to relaunch events from HelpButton (or anywhere else)
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey: string }>).detail;
      if (detail?.storageKey !== storageKey) return;
      setRun(true);
    };
    window.addEventListener(RELAUNCH_EVENT, handler);
    return () => window.removeEventListener(RELAUNCH_EVENT, handler);
  }, [storageKey]);

  const handleEvent = useCallback(
    (data: EventData) => {
      const status = data.status;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        localStorage.setItem(storageKey, new Date().toISOString());
        setRun(false);
      }
    },
    [storageKey],
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      onEvent={handleEvent}
      continuous
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular",
      }}
      options={{
        primaryColor: branding.primaryColor,
        textColor: "#3D2B1F",
        backgroundColor: "#FFFFFF",
        overlayColor: "rgba(20, 24, 38, 0.45)",
        arrowColor: "#FFFFFF",
        zIndex: 10000,
        showProgress: true,
        buttons: ["back", "skip", "primary"],
      }}
    />
  );
}
