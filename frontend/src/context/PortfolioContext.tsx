// src/context/PortfolioContext.tsx
//
// Single global store for the entire borrower portfolio.
// Holds: borrower list (the "API response"), filters, sort, and all derived data.
// Both BorrowerPanel and GraphPanel read from this — zero duplication.
// No business logic is duplicated; every filter, sort, and count is computed once here.

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { Borrower, RiskLevel } from "../types/borrower";
import { parseCSV } from "../utils/csvParser";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type RiskFilter = RiskLevel | "all";
export type SortKey =
  | "borrower_health_index"
  | "ficoscore"
  | "total_loan_amount"
  | "maxdpd";
export type SortDirection = "asc" | "desc";

export interface PortfolioCounts {
  all: number;
  healthy: number;
  moderate: number;
  high: number;
}

interface PortfolioContextValue {
  // ── Data ────────────────────────────────────────────────────────────────────
  /** The full list of imported borrowers — single source of truth */
  borrowers: Borrower[];
  /** Replace the entire borrower list (e.g. after CSV import) */
  setBorrowers: (data: Borrower[]) => void;

  // ── Filters ─────────────────────────────────────────────────────────────────
  query: string;
  setQuery: (q: string) => void;
  riskFilter: RiskFilter;
  setRiskFilter: (f: RiskFilter) => void;
  industryFilter: string;
  setIndustryFilter: (v: string) => void;
  stateFilter: string;
  setStateFilter: (v: string) => void;

  // ── Sort ────────────────────────────────────────────────────────────────────
  sortKey: SortKey;
  sortDir: SortDirection;
  toggleSort: (key: SortKey) => void;

  // ── Derived (memoised) ──────────────────────────────────────────────────────
  filteredBorrowers: Borrower[];
  counts: PortfolioCounts;
  uniqueIndustries: string[];
  uniqueStates: string[];
}

// ─── Context ───────────────────────────────────────────────────────────────────

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: ReactNode }) {
  // ── Raw data ─────────────────────────────────────────────────────────────
  const [borrowers, setBorrowersState] = useState<Borrower[]>([]);

  useEffect(() => {
    fetch(`/data.csv?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("No CSV found in public folder");
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("CSV not found in public folder (returned HTML fallback)");
        }
        return res.text();
      })
      .then((csvText) => parseCSV(csvText))
      .then((data) => setBorrowersState(data))
      .catch((err) => console.log(err.message));
  }, []);

  const setBorrowers = useCallback((data: Borrower[]) => {
    setBorrowersState(data);
  }, []);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [industryFilter, setIndustryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  // ── Sort state ───────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<SortKey>("borrower_health_index");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey]
  );

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredBorrowers = useMemo(() => {
    let data = borrowers;
    if (query) {
      const q = query.toLowerCase();
      data = data.filter(
        (b) =>
          b.companybusinessname.toLowerCase().includes(q) ||
          b.borrowerid.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.state.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "all")
      data = data.filter((b) => b.riskLevel === riskFilter);
    if (industryFilter)
      data = data.filter((b) => b.industryClean === industryFilter);
    if (stateFilter) data = data.filter((b) => b.state === stateFilter);
    return [...data].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [query, riskFilter, industryFilter, stateFilter, sortKey, sortDir, borrowers]);

  const counts = useMemo<PortfolioCounts>(
    () => ({
      all: borrowers.length,
      healthy: borrowers.filter((b) => b.riskLevel === "healthy").length,
      moderate: borrowers.filter((b) => b.riskLevel === "moderate").length,
      high: borrowers.filter((b) => b.riskLevel === "high").length,
    }),
    [borrowers]
  );

  const uniqueIndustries = useMemo(
    () => Array.from(new Set(borrowers.map((b) => b.industryClean))).sort(),
    [borrowers]
  );

  const uniqueStates = useMemo(
    () => Array.from(new Set(borrowers.map((b) => b.state))).sort(),
    [borrowers]
  );

  return (
    <PortfolioContext.Provider
      value={{
        borrowers,
        setBorrowers,
        query,
        setQuery,
        riskFilter,
        setRiskFilter,
        industryFilter,
        setIndustryFilter,
        stateFilter,
        setStateFilter,
        sortKey,
        sortDir,
        toggleSort,
        filteredBorrowers,
        counts,
        uniqueIndustries,
        uniqueStates,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("usePortfolio must be used inside <PortfolioProvider>");
  }
  return ctx;
}
