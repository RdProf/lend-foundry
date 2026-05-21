// LAYER 3 - Experiential Only
// src/components/shared/ContextualInsightOverlay.tsx
// Purely visual overlay providing context about the selected borrower.
// Reads from shared borrower state without new API calls.

import { memo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Borrower } from "../../types/borrower";
import { riskColors } from "../../constants/risk";
import { useMotionConfig } from "../../hooks/useMotion";
import { getUnmappedBorrowerDetailFields } from "../../utils/borrowerDetails";

interface ContextualInsightOverlayProps {
  borrower: Borrower;
  onClose: () => void;
}

export const ContextualInsightOverlay = memo(function ContextualInsightOverlay({
  borrower,
  onClose,
}: ContextualInsightOverlayProps) {
  const { cinematicTransition, staggerDelay } = useMotionConfig();
  const overlayRef = useRef<HTMLDivElement>(null);
  const colors = riskColors[borrower.riskLevel];
  
  // Calculate a mock "relationship count" based on active loans and CSV fields for visual depth
  const relationshipCount = borrower.active_loans + getUnmappedBorrowerDetailFields(borrower).length;

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Use capture to avoid closing immediately if triggered by a click that propagated
    document.addEventListener("mousedown", handleClickOutside, { capture: true });
    return () => document.removeEventListener("mousedown", handleClickOutside, { capture: true });
  }, [onClose]);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 5, transition: { duration: 0.2 } }}
      transition={cinematicTransition}
      className="absolute right-6 top-6 z-30 flex w-[280px] flex-col overflow-hidden rounded-[12px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.95)] shadow-[0_12px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[var(--color-border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] text-[12px] font-bold"
            style={{ background: colors.ring, color: colors.dot }}
          >
            {borrower.initials}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-bold text-[var(--color-text-primary)]">
              {borrower.companybusinessname}
            </h3>
            <p className="text-[10.5px] font-medium text-[var(--color-text-tertiary)]">
              {borrower.industryClean}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Close Insight"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 px-4 py-3">
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: staggerDelay * 1 }}
          className="flex items-center justify-between"
        >
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">Risk Tier</span>
          <span
            className="rounded-full border px-[8px] py-[2px] text-[10px] font-bold uppercase tracking-[0.3px]"
            style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}
          >
            {borrower.riskLabel}
          </span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: staggerDelay * 2 }}
          className="flex items-center justify-between"
        >
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">Network Nodes</span>
          <span className="text-[12px] font-bold text-[var(--color-text-primary)]">
            {relationshipCount} connected
          </span>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: staggerDelay * 3 }}
          className="flex items-center justify-between"
        >
          <span className="text-[11px] font-medium text-[var(--color-text-secondary)]">Health Index</span>
          <span className="text-[12px] font-bold text-[var(--color-text-primary)]" style={{ color: colors.dot }}>
            {borrower.borrower_health_index}
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
});
