// src/components/shell/ModeToggle.tsx
//
// Segmented [ Workspace | Intelligence ] toggle.
// Reads/writes ExperienceModeContext — zero prop drilling.
// Uses a Framer Motion layout-animated pill for the active indicator
// so the transition is GPU-accelerated and never triggers a shell re-render.

import { motion } from "framer-motion";
import { useExperienceMode } from "../../context/ExperienceModeContext";
import type { ExperienceMode } from "../../context/ExperienceModeContext";

// ─── Segment definition ────────────────────────────────────────────────────────

const SEGMENTS: { id: ExperienceMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "workspace",
    label: "Workspace",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="7.5" y="1" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: (
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
        <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M2.93 2.93l1.41 1.41M8.66 8.66l1.41 1.41M8.66 4.34L10.07 2.93M4.34 8.66L2.93 10.07" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ModeToggle() {
  const { mode, setMode } = useExperienceMode();

  return (
    <div
      role="tablist"
      aria-label="Experience mode"
      className="relative flex h-[34px] items-center gap-0.5 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-bg)] p-[3px]"
    >
      {SEGMENTS.map((seg) => {
        const isActive = mode === seg.id;

        return (
          <button
            key={seg.id}
            role="tab"
            id={`mode-toggle-${seg.id}`}
            aria-selected={isActive}
            onClick={() => setMode(seg.id)}
            className="relative z-10 flex h-full cursor-pointer items-center gap-[6px] rounded-[7px] px-[11px] text-[12px] font-semibold tracking-[0.1px] transition-colors duration-150"
            style={{
              color: isActive
                ? "var(--color-accent)"
                : "var(--color-text-secondary)",
            }}
          >
            {/* Framer Motion shared layout pill — morphs between buttons */}
            {isActive && (
              <motion.span
                layoutId="mode-toggle-pill"
                className="absolute inset-0 rounded-[7px] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                style={{ zIndex: -1 }}
              />
            )}

            <span className="relative flex-shrink-0">{seg.icon}</span>
            <span className="relative">{seg.label}</span>
          </button>
        );
      })}
    </div>
  );
}
