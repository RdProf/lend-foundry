// src/context/ExperienceModeContext.tsx

import { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { Borrower } from "../types/borrower";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExperienceMode = "workspace" | "intelligence";

interface ExperienceModeContextValue {
  mode: ExperienceMode;
  setMode: (mode: ExperienceMode) => void;
  /** The borrower currently being inspected. Shared by BorrowerPanel and GraphPanel. */
  selectedBorrower: Borrower | null;
  setSelectedBorrower: (b: Borrower | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ExperienceModeContext = createContext<ExperienceModeContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ExperienceModeProviderProps {
  children: ReactNode;
}

export function ExperienceModeProvider({ children }: ExperienceModeProviderProps) {
  const [mode, setModeState] = useState<ExperienceMode>("workspace");
  const [selectedBorrower, setSelectedBorrowerState] = useState<Borrower | null>(null);

  // Stable references — memoised so downstream consumers don't re-render on unrelated state
  const setMode = useCallback((next: ExperienceMode) => {
    setModeState(next);
  }, []);

  const setSelectedBorrower = useCallback((b: Borrower | null) => {
    setSelectedBorrowerState(b);
  }, []);

  return (
    <ExperienceModeContext.Provider value={{ mode, setMode, selectedBorrower, setSelectedBorrower }}>
      {children}
    </ExperienceModeContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExperienceMode(): ExperienceModeContextValue {
  const ctx = useContext(ExperienceModeContext);
  if (!ctx) {
    throw new Error("useExperienceMode must be used inside <ExperienceModeProvider>");
  }
  return ctx;
}
