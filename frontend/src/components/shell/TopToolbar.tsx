// src/components/shell/TopToolbar.tsx
//
// Persistent top toolbar strip.
// Houses the ModeToggle (which writes to ExperienceModeContext).
// The toolbar itself is wrapped in React.memo — only ModeToggle
// subscribes to the context, so this parent never re-renders on mode change.

import { memo, useRef } from "react";
import { ModeToggle } from "./ModeToggle";

// ─── Component ────────────────────────────────────────────────────────────────

export const TopToolbar = memo(function TopToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header
      id="app-top-toolbar"
      className="flex h-[52px] flex-shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5"
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      {/* Brand wordmark */}
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-extrabold tracking-[-0.4px] text-[var(--color-text-primary)]">
          Lend<span className="text-[var(--color-accent)]">·</span>IQ
        </span>
        <span className="rounded-[var(--radius-full)] bg-[var(--color-accent-bg)] px-[9px] py-[2px] text-[10px] font-bold uppercase tracking-[0.4px] text-[var(--color-accent)]">
          OS
        </span>
      </div>

      {/* Divider */}
      <div className="h-[18px] w-px bg-[var(--color-border)]" />

      {/* ── Mode Toggle — the only context subscriber here ── */}
      <ModeToggle />

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-3">
        {/* Search shortcut */}
        <button
          id="toolbar-search"
          aria-label="Global search"
          className="flex h-[32px] items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-bg)] px-[10px] text-[12px] font-medium text-[var(--color-text-tertiary)] transition-all hover:border-[#cbd5e1] hover:text-[var(--color-text-secondary)]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>Search</span>
          <kbd className="ml-1 rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-[5px] py-[1px] text-[10px] font-mono font-semibold text-[var(--color-text-tertiary)]">
            ⌘K
          </kbd>
        </button>

        {/* CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          id="toolbar-csv-input"
          className="hidden"
        />
        <button
          id="toolbar-import-csv"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-[32px] items-center gap-1.5 rounded-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] px-[11px] text-[12px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
            <path d="M6.5 1v7M3.5 5.5L6.5 9l3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Import CSV
        </button>

        {/* Notification bell */}
        <button
          id="toolbar-notifications"
          aria-label="Notifications"
          className="relative flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[var(--color-text-tertiary)] transition-all hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2a4 4 0 014 4v2.5l1.5 2H2.5L4 8.5V6a4 4 0 014-4zM6.5 12.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Unread dot */}
          <span className="absolute right-[7px] top-[7px] h-[6px] w-[6px] rounded-full bg-[var(--color-accent)]" />
        </button>
      </div>
    </header>
  );
});
