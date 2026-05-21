// src/components/shell/Navbar.tsx
//
// Persistent left-side nav bar.
// Never re-renders due to mode changes — it never reads ExperienceModeContext.
// Purely structural chrome: brand mark + nav icons.

import { memo } from "react";

// ─── Nav icon items ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    id: "nav-portfolio",
    label: "Portfolio",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    active: true,
  },
  {
    id: "nav-analytics",
    label: "Analytics",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M2 14l4-5 3 3 4-6 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    active: false,
  },
  {
    id: "nav-alerts",
    label: "Alerts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M9 2a5 5 0 015 5v3l1.5 2H2.5L4 10V7a5 5 0 015-5zM7.5 14a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    active: false,
  },
  {
    id: "nav-settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M13.37 4.63l1.41-1.41M3.22 14.78l1.41-1.41" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    active: false,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const Navbar = memo(function Navbar() {
  return (
    <nav
      id="app-navbar"
      aria-label="Main navigation"
      className="flex w-[60px] flex-shrink-0 flex-col items-center border-r border-[var(--color-border)] bg-[var(--color-surface)] py-4"
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      {/* Brand mark */}
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--color-accent)] text-white">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M3 14L9 4l6 10H3z" fill="currentColor" />
        </svg>
      </div>

      {/* Divider */}
      <div className="mb-4 h-px w-8 bg-[var(--color-border)]" />

      {/* Nav items */}
      <div className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={item.id}
            aria-label={item.label}
            title={item.label}
            className={[
              "group relative flex h-10 w-10 items-center justify-center rounded-[9px] transition-all duration-150",
              item.active
                ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)]"
                : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)]",
            ].join(" ")}
          >
            {item.icon}

            {/* Tooltip */}
            <span className="pointer-events-none absolute left-[calc(100%+10px)] z-50 whitespace-nowrap rounded-[6px] bg-[var(--color-text-primary)] px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom spacer + avatar */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-[12px] font-bold text-white">
          L
        </div>
      </div>
    </nav>
  );
});
