// src/components/shell/MainWorkspace.tsx
//
// Two-panel adaptive layout.
// Both panels are ALWAYS mounted — they never unmount between mode switches.
// Framer Motion `layout` prop on each panel's motion.div animates width
// changes smoothly (~400ms ease-in-out spring) when mode changes.
//
// WORKSPACE MODE  →  BorrowerPanel ~40% | GraphPanel ~60%
// INTELLIGENCE    →  BorrowerPanel ~18% | GraphPanel ~82%
//
// The underlying CSS uses flex; Framer Motion drives the flex-basis via
// inline style and the `layout` prop triggers a GPU-accelerated layout
// animation between the two states.

import { memo } from "react";
import { motion, MotionConfig } from "framer-motion";
import { useExperienceMode } from "../../context/ExperienceModeContext";
import { useMotionConfig } from "../../hooks/useMotion";
import { BorrowerPanel } from "./BorrowerPanel";
import { GraphPanel } from "./GraphPanel";

// ─── Width config ──────────────────────────────────────────────────────────────
// WORKSPACE MODE  →  BorrowerPanel ~38% | GraphPanel ~62%
// INTELLIGENCE    →  BorrowerPanel collapsed (0) | GraphPanel full width
//
// The sidebar stays MOUNTED in intelligence mode — only width collapses.
// Framer Motion `layout` prop animates the transition GPU-accelerated.

const WIDTHS = {
  workspace: { borrower: "55.5%", graph: "44.5%" },
  intelligence: { borrower: "0px", graph: "100%" },
} as const;

// ─── MainWorkspace ─────────────────────────────────────────────────────────────

export const MainWorkspace = memo(function MainWorkspace() {
  const { mode } = useExperienceMode();
  const widths = WIDTHS[mode];
  const isIntelligence = mode === "intelligence";
  const { cinematicTransition } = useMotionConfig();

  return (
    <MotionConfig transition={cinematicTransition}>
      <div
        id="main-workspace"
        className="flex min-h-0 flex-1 overflow-hidden"
      >
        {/* ── BorrowerPanel ── */}
        <motion.div
          layout
          id="borrower-panel-container"
          className="relative flex flex-col overflow-hidden border-r border-[var(--color-border)]"
          style={{ minWidth: 0, flexShrink: 0 }}
          animate={{
            width: widths.borrower,
            opacity: isIntelligence ? 0 : 1,
            borderRightWidth: isIntelligence ? 0 : 1,
          }}
          transition={cinematicTransition}
        >
          <BorrowerPanel />
        </motion.div>

        {/* ── GraphPanel ── */}
        <motion.div
          layout
          id="graph-panel-container"
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden"
          style={{ transformOrigin: "center center" }}
          animate={{
            width: widths.graph,
          }}
          transition={cinematicTransition}
        >
          <GraphPanel />
        </motion.div>
      </div>
    </MotionConfig>
  );
});
