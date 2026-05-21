// src/components/shell/AppShell.tsx
//
// The unified application shell. Structure is exactly:
//   <AppShell>
//     <Navbar />          ← static — never re-renders
//     <TopToolbar />      ← static — never re-renders (ModeToggle inside does)
//     <MainWorkspace />   ← adapts to ExperienceMode
//   </AppShell>
//
// No route changes. No page mounts. One shell, always.

import { memo } from "react";
import { Navbar } from "./Navbar";
import { TopToolbar } from "./TopToolbar";
import { MainWorkspace } from "./MainWorkspace";

export const AppShell = memo(function AppShell() {
  return (
    <div
      id="app-shell"
      className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]"
    >
      {/* ── Left side: persistent vertical nav ── */}
      <Navbar />

      {/* ── Right side: header + content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopToolbar />
        <MainWorkspace />
      </div>
    </div>
  );
});
