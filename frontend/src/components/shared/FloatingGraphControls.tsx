// LAYER 3 - Experiential Only
// src/components/shared/FloatingGraphControls.tsx
// Purely visual overlay for intelligence mode graph interactions.
// Contains NO business logic or data fetching.

import { memo } from "react";
import { motion } from "framer-motion";
import { useMotionConfig } from "../../hooks/useMotion";

export const FloatingGraphControls = memo(function FloatingGraphControls() {
  const { baseDelay, cinematicTransition } = useMotionConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: baseDelay, ...cinematicTransition }}
      className="absolute left-6 top-6 z-20 flex flex-col gap-2"
    >
      {/* Zoom Controls */}
      <div className="flex flex-col overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.85)] shadow-[var(--shadow-sm)] backdrop-blur-md">
        <button
          className="flex h-8 w-8 items-center justify-center text-[16px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset"
          aria-label="Zoom In"
        >
          +
        </button>
        <div className="h-px w-full bg-[var(--color-border-subtle)]" />
        <button
          className="flex h-8 w-8 items-center justify-center text-[16px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-inset"
          aria-label="Zoom Out"
        >
          −
        </button>
      </div>

      {/* Filter / Focus Toggles */}
      <div className="mt-2 flex flex-col gap-1.5">
        <button
          className="group relative flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.85)] shadow-[var(--shadow-sm)] backdrop-blur-md transition-colors hover:bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Toggle Risk Filters"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-[var(--color-text-primary)]">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
        <button
          className="group relative flex h-8 w-8 items-center justify-center rounded-[8px] border border-[var(--color-border)] bg-[rgba(255,255,255,0.85)] shadow-[var(--shadow-sm)] backdrop-blur-md transition-colors hover:bg-[var(--color-bg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Focus Mode"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors group-hover:stroke-[var(--color-text-primary)]">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
});
