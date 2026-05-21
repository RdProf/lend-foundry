// src/components/shell/BorrowerPanel.tsx
//
// Thin layout shell. All business logic (filters, sort, borrower data) lives
// in PortfolioContext. All presentation lives in BorrowerCard variants.
// This component ONLY handles:
//   - mode-dependent layout switching (display:none for scroll preservation)
//   - CSV file input wiring
//   - pagination (view concern)
//
// NEVER duplicate business logic here — it all comes from usePortfolio().

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { parseCSV } from "../../utils/csvParser";
import type { Borrower } from "../../types/borrower";
import { useExperienceMode } from "../../context/ExperienceModeContext";
import { usePortfolio, type RiskFilter } from "../../context/PortfolioContext";
import { BorrowerCard } from "../shared/BorrowerCard";

// ─── Table column config ───────────────────────────────────────────────────────

type SortKey = "borrower_health_index" | "ficoscore" | "total_loan_amount" | "maxdpd";

const tableColumns: Array<{ label: string; key?: SortKey }> = [
  { label: "Business" },
  { label: "Industry" },
  { label: "Location" },
  { label: "Health", key: "borrower_health_index" },
  { label: "FICO", key: "ficoscore" },
  { label: "Loans", key: "total_loan_amount" },
  { label: "Max DPD", key: "maxdpd" },
  { label: "Risk" },
];

// ─── BorrowerPanel ─────────────────────────────────────────────────────────────

export function BorrowerPanel() {
  const { mode, selectedBorrower, setSelectedBorrower } = useExperienceMode();
  const portfolio = usePortfolio();
  const isIntelligence = mode === "intelligence";

  // ── Pagination (view concern — not in store) ─────────────────────────────
  const itemsPerPage = isIntelligence ? 20 : 12;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [
    portfolio.query,
    portfolio.riskFilter,
    portfolio.industryFilter,
    portfolio.stateFilter,
    portfolio.sortKey,
    portfolio.sortDir,
    portfolio.borrowers,
  ]);

  const paginatedBorrowers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return portfolio.filteredBorrowers.slice(start, start + itemsPerPage);
  }, [portfolio.filteredBorrowers, currentPage, itemsPerPage]);

  const totalPages =
    Math.ceil(portfolio.filteredBorrowers.length / itemsPerPage) || 1;

  // ── CSV file input ───────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = useCallback(
      async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
          const text = await file.text();
          // 1. Save to public directory
          await fetch("/api/upload-csv", {
            method: "POST",
            body: text,
          });

          // 2. Read from public directory
          const res = await fetch(`/data.csv?t=${Date.now()}`);
          if (!res.ok) throw new Error("Failed to load CSV from public folder");          
          const csvText = await res.text();
          const borrowers = await parseCSV(csvText);
          portfolio.setBorrowers(borrowers);
        } catch (err: any) {
          alert(err.message || "Error processing CSV");
        }

        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      [portfolio]
    );

  const triggerImport = () => fileInputRef.current?.click();

  // ── Filter dropdown ──────────────────────────────────────────────────────
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(e.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--color-surface)]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        id="borrower-panel-csv-input"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* BOTH panels always mounted — display:none preserves scroll position */}
      <div
        style={{
          display: isIntelligence ? "flex" : "none",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <CondensedLayout
          borrowers={portfolio.filteredBorrowers}
          selected={selectedBorrower}
          onSelect={setSelectedBorrower}
          query={portfolio.query}
          onQuery={portfolio.setQuery}
          counts={portfolio.counts}
          riskFilter={portfolio.riskFilter}
          onRiskFilter={portfolio.setRiskFilter}
          onImport={triggerImport}
        />
      </div>

      <div
        style={{
          display: isIntelligence ? "none" : "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <FullTableLayout
          borrowers={paginatedBorrowers}
          filteredCount={portfolio.filteredBorrowers.length}
          totalCount={portfolio.borrowers.length}
          selected={selectedBorrower}
          onSelect={setSelectedBorrower}
          query={portfolio.query}
          onQuery={portfolio.setQuery}
          counts={portfolio.counts}
          riskFilter={portfolio.riskFilter}
          onRiskFilter={portfolio.setRiskFilter}
          sortKey={portfolio.sortKey}
          sortDir={portfolio.sortDir}
          onSort={portfolio.toggleSort}
          currentPage={currentPage}
          totalPages={totalPages}
          onPage={setCurrentPage}
          industryFilter={portfolio.industryFilter}
          stateFilter={portfolio.stateFilter}
          onIndustryFilter={portfolio.setIndustryFilter}
          onStateFilter={portfolio.setStateFilter}
          uniqueIndustries={portfolio.uniqueIndustries}
          uniqueStates={portfolio.uniqueStates}
          isFilterOpen={isFilterOpen}
          onToggleFilter={() => setIsFilterOpen((v) => !v)}
          filterRef={filterRef}
          onImport={triggerImport}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
}

// ─── Condensed layout (Intelligence mode) ──────────────────────────────────────

function CondensedLayout({
  borrowers,
  selected,
  onSelect,
  query,
  onQuery,
  counts,
  riskFilter,
  onRiskFilter,
  onImport,
}: {
  borrowers: Borrower[];
  selected: Borrower | null;
  onSelect: (b: Borrower) => void;
  query: string;
  onQuery: (q: string) => void;
  counts: { all: number; healthy: number; moderate: number; high: number };
  riskFilter: RiskFilter;
  onRiskFilter: (f: RiskFilter) => void;
  onImport: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header strip */}
      <div className="flex-shrink-0 border-b border-[var(--color-border)] px-3 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-tertiary)]">
            Portfolio
          </span>
          <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">
            {counts.all}
          </span>
        </div>

        {/* Mini search */}
        <div className="relative mb-2">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            width="11"
            height="11"
            viewBox="0 0 13 13"
            fill="none"
          >
            <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Filter borrowers…"
            className="w-full rounded-[7px] border border-[var(--color-border)] bg-[var(--color-bg)] py-[6px] pl-7 pr-2 text-[11px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)]"
          />
        </div>

        {/* Risk pills */}
        <div className="flex flex-wrap gap-1">
          {(
            [
              { key: "all" as const, label: "All", count: counts.all },
              { key: "healthy" as const, label: "OK", count: counts.healthy },
              { key: "moderate" as const, label: "Mod", count: counts.moderate },
              { key: "high" as const, label: "High", count: counts.high },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => onRiskFilter(f.key)}
              className={[
                "rounded-[var(--radius-full)] border px-[8px] py-[3px] text-[10px] font-semibold transition-all duration-150",
                riskFilter === f.key
                  ? "border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]"
                  : "border-[var(--color-border)] bg-transparent text-[var(--color-text-tertiary)] hover:border-[#cbd5e1]",
              ].join(" ")}
            >
              {f.label} <span className="opacity-60">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable identity list — uses BorrowerCard compact variant */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {borrowers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <button
              onClick={onImport}
              className="rounded-[8px] bg-[var(--color-accent)] px-3 py-2 text-[11px] font-semibold text-white"
            >
              Import CSV
            </button>
          </div>
        ) : (
          borrowers.map((b) => (
            <BorrowerCard
              key={b.borrowerid}
              borrower={b}
              variant="compact"
              isSelected={selected?.borrowerid === b.borrowerid}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Full table layout (Workspace mode) ────────────────────────────────────────

function FullTableLayout({
  borrowers,
  filteredCount,
  totalCount,
  selected,
  onSelect,
  query,
  onQuery,
  counts,
  riskFilter,
  onRiskFilter,
  sortKey,
  sortDir,
  onSort,
  currentPage,
  totalPages,
  onPage,
  industryFilter,
  stateFilter,
  onIndustryFilter,
  onStateFilter,
  uniqueIndustries,
  uniqueStates,
  isFilterOpen,
  onToggleFilter,
  filterRef,
  onImport,
  itemsPerPage,
}: {
  borrowers: Borrower[];
  filteredCount: number;
  totalCount: number;
  selected: Borrower | null;
  onSelect: (b: Borrower) => void;
  query: string;
  onQuery: (q: string) => void;
  counts: { all: number; healthy: number; moderate: number; high: number };
  riskFilter: RiskFilter;
  onRiskFilter: (f: RiskFilter) => void;
  sortKey: SortKey;
  sortDir: string;
  onSort: (k: SortKey) => void;
  currentPage: number;
  totalPages: number;
  onPage: (p: number) => void;
  industryFilter: string;
  stateFilter: string;
  onIndustryFilter: (v: string) => void;
  onStateFilter: (v: string) => void;
  uniqueIndustries: string[];
  uniqueStates: string[];
  isFilterOpen: boolean;
  onToggleFilter: () => void;
  filterRef: React.RefObject<HTMLDivElement | null>;
  onImport: () => void;
  itemsPerPage: number;
}) {
  const filterPillBase =
    "cursor-pointer rounded-[var(--radius-full)] border px-[12px] py-[6px] text-[11px] font-semibold transition-all duration-150";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sub-header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.4px] text-[var(--color-text-tertiary)]">
          Borrower Portfolio
        </span>
        {totalCount > 0 && (
          <>
            <div className="h-[12px] w-px bg-[var(--color-border)]" />
            <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
              {totalCount} borrowers
            </span>
          </>
        )}
        <div className="ml-auto">
          <button
            onClick={onImport}
            className="flex items-center gap-1.5 rounded-[7px] border border-[var(--color-border)] bg-[var(--color-surface)] px-[10px] py-[5px] text-[11px] font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
          >
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v7M3.5 5.5L6.5 9l3-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M1.5 10.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Import CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-3">
        {totalCount === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-8 text-center">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="mb-1 text-[15px] font-bold text-[var(--color-text-primary)]">
                No Borrower Data
              </h3>
              <p className="mb-4 text-[12.5px] text-[var(--color-text-secondary)]">
                Import a CSV to get started.
              </p>
              <button
                onClick={onImport}
                className="rounded-[8px] bg-[var(--color-accent)] px-4 py-2 text-[12px] font-semibold text-white hover:bg-blue-700"
              >
                Import CSV File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1" ref={filterRef}>
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
              >
                <circle cx="5.5" cy="5.5" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                <path d="M8.5 8.5L11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                id="borrower-search"
                value={query}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Search by name, ID, city or state…"
                autoComplete="off"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-[8px] pl-9 pr-9 text-[12.5px] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.1)] transition-all"
              />
              <button
                onClick={onToggleFilter}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </button>
              {isFilterOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[220px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-lg)]">
                  <div className="mb-3">
                    <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
                      Industry
                    </label>
                    <select
                      value={industryFilter}
                      onChange={(e) => onIndustryFilter(e.target.value)}
                      className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">All Industries</option>
                      {uniqueIndustries.map((i) => (
                        <option key={i} value={i}>{i}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">
                      State
                    </label>
                    <select
                      value={stateFilter}
                      onChange={(e) => onStateFilter(e.target.value)}
                      className="w-full rounded-[6px] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                    >
                      <option value="">All States</option>
                      {uniqueStates.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Risk pills */}
            {(
              [
                { key: "all" as const, label: "All", count: counts.all },
                { key: "healthy" as const, label: "Healthy", count: counts.healthy },
                { key: "moderate" as const, label: "Moderate", count: counts.moderate },
                { key: "high" as const, label: "High Risk", count: counts.high },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                id={`filter-${f.key}`}
                className={`${filterPillBase} ${
                  riskFilter === f.key
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                }`}
                onClick={() => onRiskFilter(f.key)}
              >
                {f.label} <span className="opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table — uses BorrowerCard dense variant */}
      {totalCount > 0 && (
        <div className="min-h-0 flex-1 overflow-auto ">
          <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--color-border)] bg-[#fafbfc]">
                {tableColumns.map((col) => (
                  <th
                    key={col.label}
                    className={[
                      "whitespace-nowrap px-4 py-[10px] text-left text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]",
                      col.key
                        ? "cursor-pointer select-none hover:text-[var(--color-text-primary)]"
                        : "",
                    ].join(" ")}
                    onClick={col.key ? () => onSort(col.key!) : undefined}
                  >
                    {col.label}
                    {col.key && (
                      <svg
                        className={`ml-1 inline-block align-middle ${
                          sortKey === col.key
                            ? "text-[var(--color-accent)]"
                            : "text-[var(--color-text-tertiary)]"
                        }`}
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        {(sortKey !== col.key || sortDir === "desc") && (
                          <path
                            d="M5 7L2 4h6L5 7z"
                            fill="currentColor"
                            opacity={sortKey === col.key ? 1 : 0.4}
                          />
                        )}
                        {(sortKey !== col.key || sortDir === "asc") && (
                          <path
                            d="M5 3l3 3H2L5 3z"
                            fill="currentColor"
                            opacity={sortKey === col.key ? 1 : 0.4}
                          />
                        )}
                      </svg>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {borrowers.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-[var(--color-text-tertiary)]"
                  >
                    No borrowers match your search
                  </td>
                </tr>
              ) : (
                borrowers.map((b) => (
                  <BorrowerCard
                    key={b.borrowerid}
                    borrower={b}
                    variant="dense"
                    isSelected={selected?.borrowerid === b.borrowerid}
                    onSelect={onSelect}
                  />
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-5 py-2.5 text-[11px] font-medium text-[var(--color-text-tertiary)]">
            <span>
              {filteredCount === 0
                ? "0"
                : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                    currentPage * itemsPerPage,
                    filteredCount
                  )}`}{" "}
              of {filteredCount}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => onPage(currentPage - 1)}
                className="rounded-[5px] border border-[var(--color-border)] px-2 py-1 transition-all disabled:opacity-40"
              >
                Prev
              </button>
              <span className="px-1">
                Page {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => onPage(currentPage + 1)}
                className="rounded-[5px] border border-[var(--color-border)] px-2 py-1 transition-all disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
