"use client";

import { HelpCircle } from "lucide-react";
import { relaunchTour } from "./TourRunner";

/**
 * Footer (?) button that re-launches the relevant tour.
 * Pass the same `storageKey` used by the corresponding TourRunner.
 */
export function HelpButton({ storageKey, label = "Ver tour novamente" }: { storageKey: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => relaunchTour(storageKey)}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-txt-muted hover:text-primary-dark hover:bg-primary/5 transition-colors w-full text-left"
      title={label}
    >
      <HelpCircle className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
