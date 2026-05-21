// src/App.tsx
//
// Root composition:
//   ExperienceModeProvider → PortfolioProvider → AppShell
//
// ExperienceModeProvider: mode + selectedBorrower
// PortfolioProvider: borrower list, filters, sort, derived data
// AppShell: stable shell that never unmounts

import { ExperienceModeProvider } from "./context/ExperienceModeContext";
import { PortfolioProvider } from "./context/PortfolioContext";
import { AppShell } from "./components/shell/AppShell";
import "./App.css";

export default function App() {
  return (
    <ExperienceModeProvider>
      <PortfolioProvider>
        <AppShell />
      </PortfolioProvider>
    </ExperienceModeProvider>
  );
}
