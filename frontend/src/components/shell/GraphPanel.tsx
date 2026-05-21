// src/components/shell/GraphPanel.tsx
//
// Persistent graph panel — uses IntelligenceGraph (the single graph component)
// and MetricsPanel (variant-based metrics display).
//
// This is a thin layout shell. All graph rendering lives in IntelligenceGraph.
// All metrics rendering lives in MetricsPanel.
// Business logic lives in PortfolioContext / ExperienceModeContext.
//
// The component is NEVER unmounted between mode switches.

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useExperienceMode } from "../../context/ExperienceModeContext";
import { useMotionConfig } from "../../hooks/useMotion";
import { riskColors } from "../../constants/risk";
import { getUnmappedBorrowerDetailFields } from "../../utils/borrowerDetails";
import { IntelligenceGraph } from "../shared/IntelligenceGraph";
import { MetricsPanel } from "../shared/MetricsPanel";

// ─── GraphPanel ────────────────────────────────────────────────────────────────

export const GraphPanel = memo(function GraphPanel() {
  const { mode, selectedBorrower, setMode } = useExperienceMode();
  const isIntelligence = mode === "intelligence";
  const hasSelection = selectedBorrower !== null;

  const riskColor = hasSelection
    ? riskColors[selectedBorrower!.riskLevel]
    : riskColors["moderate"];
  const unmappedFields = hasSelection
    ? getUnmappedBorrowerDetailFields(selectedBorrower!)
    : [];
  const emptyFieldCount = unmappedFields.filter((f) => f.isEmpty).length;
  const { cinematicTransition, staggerDelay, baseDelay } = useMotionConfig();

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-bg)]">
      {/* ── Header bar ── */}
      <div
        className={[
          "relative z-10 flex flex-shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] backdrop-blur-md",
          isIntelligence ? "h-[52px] px-5" : "h-[44px] px-4",
        ].join(" ")}
      >
        {/* Intelligence mode: back-to-workspace button */}
        {isIntelligence && (
          <button
            onClick={() => setMode("workspace")}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-[10px] py-[5px] text-[11px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            title="Back to Workspace"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Workspace
          </button>
        )}

        {/* Borrower identity */}
        {hasSelection ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex flex-shrink-0 items-center justify-center rounded-[8px] font-bold"
              style={{
                width: isIntelligence ? 34 : 28,
                height: isIntelligence ? 34 : 28,
                fontSize: isIntelligence ? 13 : 11,
                background: riskColor.ring,
                color: riskColor.dot,
              }}
            >
              {selectedBorrower!.initials}
            </div>
            <div className="min-w-0">
              <div
                className={[
                  "truncate font-bold tracking-tight text-[var(--color-text-primary)]",
                  isIntelligence ? "text-[14px]" : "text-[12.5px]",
                ].join(" ")}
              >
                {selectedBorrower!.companybusinessname}
              </div>
              {isIntelligence && (
                <div className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
                  {selectedBorrower!.borrowerid} · {selectedBorrower!.city},{" "}
                  {selectedBorrower!.state}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-[6px] bg-[var(--color-border-subtle)]" />
            <span className="text-[12px] font-medium text-[var(--color-text-tertiary)]">
              No borrower selected
            </span>
          </div>
        )}

        {/* KPI metrics — uses MetricsPanel summary variant */}
        {hasSelection && (
          <div className="ml-auto">
            <MetricsPanel
              borrower={selectedBorrower!}
              variant="summary"
            />
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className="flex min-h-0 flex-1">
        {/* Graph canvas — uses IntelligenceGraph */}
        {hasSelection ? (
          <IntelligenceGraph
            borrower={selectedBorrower!}
            immersive={isIntelligence}
          />
        ) : (
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 z-30">
              <EmptyGraphState
                isIntelligence={isIntelligence}
                onSwitchToWorkspace={() => setMode("workspace")}
              />
            </div>
          </div>
        )}

        {/* Intelligence-only: unmapped CSV fields side panel */}
        <AnimatePresence>
          {isIntelligence && unmappedFields.length > 0 && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0, transition: { duration: 0.2 } }}
              transition={cinematicTransition}
              className="flex flex-shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
            >
              <div className="flex w-[220px] flex-col h-full">
                <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--color-text-primary)]">
                    CSV Fields
                  </h2>
                  <p className="mt-0.5 text-[10.5px] text-[var(--color-text-tertiary)]">
                    {unmappedFields.length} fields
                    {emptyFieldCount > 0 ? ` · ${emptyFieldCount} empty` : ""}
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="flex flex-col gap-2">
                    {unmappedFields.map((field, index) => (
                      <motion.div
                        key={field.column}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 0 }}
                        transition={{
                          opacity: { delay: baseDelay + index * staggerDelay, duration: 0.3 },
                          y: { delay: baseDelay + index * staggerDelay, duration: 0.3 }
                        }}
                        className={[
                          "rounded-[8px] border px-2.5 py-2",
                          field.isEmpty
                            ? "border-dashed border-[var(--color-border)] bg-[#fafbfc]"
                            : "border-[var(--color-border-subtle)] bg-white",
                        ].join(" ")}
                      >
                        <div className="mb-0.5 text-[9.5px] font-bold uppercase tracking-[0.4px] text-[var(--color-text-tertiary)]">
                          {field.label}
                        </div>
                        <div
                          className={[
                            "break-words text-[11.5px] font-semibold leading-snug",
                            field.isEmpty
                              ? "text-[var(--color-text-tertiary)]"
                              : "text-[var(--color-text-primary)]",
                          ].join(" ")}
                        >
                          {field.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ─── Empty graph state ─────────────────────────────────────────────────────────

function EmptyGraphState({
  isIntelligence,
  onSwitchToWorkspace,
}: {
  isIntelligence: boolean;
  onSwitchToWorkspace: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 bg-[var(--color-bg)]">
      <div className="relative flex h-[100px] w-[100px] items-center justify-center">
        <div className="absolute inset-0 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] rounded-full border border-[var(--color-accent)] opacity-[0.18]" />
        <div className="absolute inset-[14px] animate-[ping_3s_cubic-bezier(0,0,0.2,1)_0.5s_infinite] rounded-full border border-[var(--color-accent)] opacity-[0.12]" />
        <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[var(--color-accent-bg)]">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="3.5" stroke="var(--color-accent)" strokeWidth="1.6" />
            <path d="M11 2v3M11 17v3M2 11h3M17 11h3" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4.64 4.64l2.12 2.12M15.24 15.24l2.12 2.12M15.24 6.76l2.12-2.12M6.76 15.24L4.64 17.36" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="text-center">
        <h3 className="mb-1.5 text-[16px] font-bold tracking-[-0.3px] text-[var(--color-text-primary)]">
          {isIntelligence ? "Select a Borrower" : "Intelligence Graph"}
        </h3>
        <p className="max-w-[260px] text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
          {isIntelligence
            ? "Click a borrower in the left panel to load their risk graph."
            : "Select a borrower from the table to visualise their intelligence graph here."}
        </p>
      </div>

      {isIntelligence && (
        <button
          onClick={onSwitchToWorkspace}
          className="rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[12px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        >
          ← Back to Workspace
        </button>
      )}
    </div>
  );
}
