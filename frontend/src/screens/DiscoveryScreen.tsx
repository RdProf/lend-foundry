import { useMemo, useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import { mapBorrower } from "../utils/borrowerMapper";
import type { RawBorrower } from "../types/borrower";
import { riskColors } from "../constants/risk";
import type { Borrower, RiskLevel } from "../types/borrower";

type DiscoveryScreenProps = {
  onSelect: (borrower: Borrower) => void;
};

type RiskFilter = RiskLevel | "all";
type SortKey = "borrower_health_index" | "ficoscore" | "total_loan_amount" | "maxdpd";
type SortDirection = "asc" | "desc";

const tableColumns: Array<{ label: string; key?: SortKey }> = [
  { label: "Business" },
  { label: "Industry" },
  { label: "Location" },
  { label: "Health Index", key: "borrower_health_index" },
  { label: "FICO", key: "ficoscore" },
  { label: "Total Loans", key: "total_loan_amount" },
  { label: "Max DPD", key: "maxdpd" },
  { label: "Risk" },
];

const filterPillBase =
  "cursor-pointer rounded-[var(--radius-full)] border px-[14px] py-[7px] text-xs font-semibold transition-all duration-150 ease-[var(--ease-smooth)]";

const tableHeaderClass =
  "whitespace-nowrap px-[18px] py-[11px] text-left text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]";

export function DiscoveryScreen({ onSelect }: DiscoveryScreenProps) {
  const [borrowerList, setBorrowerList] = useState<Borrower[]>(() => {
    const saved = localStorage.getItem("borrowerData");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved borrower data", e);
      }
    }
    return [];
  });
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("borrower_health_index");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const itemsPerPage = 12;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useMemo(() => {
    setCurrentPage(1);
  }, [query, riskFilter, industryFilter, stateFilter, sortDir, sortKey, borrowerList]);

  const uniqueIndustries = useMemo(() => Array.from(new Set(borrowerList.map(b => b.industryClean))).sort(), [borrowerList]);
  const uniqueStates = useMemo(() => Array.from(new Set(borrowerList.map(b => b.state))).sort(), [borrowerList]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0 && !results.data[0].borrowerid && !results.data[0].companybusinessname) {
          alert("Invalid CSV format. Missing required 'borrowerid' or 'companybusinessname' columns.");
          return;
        }

        const parsedData = results.data.map((row) => {
          const raw: RawBorrower = {
            borrowerid: row.borrowerid || "",
            companybusinessname: row.companybusinessname || "",
            city: row.city || "",
            state: row.state || "",
            industry: row.industry || "",
            ficoscore: row.ficoscore ? Number(row.ficoscore) : null,
            timeinbusiness: Number(row.timeinbusiness) || 0,
            latestannualrevenue: Number(row.latestannualrevenue) || 0,
            total_loan_amount: Number(row.total_loan_amount) || 0,
            active_loans: Number(row.active_loans) || 0,
            maxdpd: Number(row.maxdpd) || 0,
            avgdpd: Number(row.avgdpd) || 0,
            repayment_score: Number(row.repayment_score) || 0,
            stability_score: Number(row.stability_score) || 0,
            exposure_score: Number(row.exposure_score) || 0,
            business_size_score: Number(row.business_size_score) || 0,
            borrower_health_index: Number(row.borrower_health_index) || 0,

            // Group 1 — Borrower Demographics
            email: row.email || null,
            phone: row.phone || null,

            // Group 2 — Business Profile
            latestannualsales: row.latestannualsales ? Number(row.latestannualsales) : null,

            // Group 3 — Credit Risk
            probability_of_default: row.probability_of_default ? Number(row.probability_of_default) : null,

            // Group 4 — Loan Exposure
            averageinterestrate: row.averageinterestrate ? Number(row.averageinterestrate) : null,
            avgtenure: row.avgtenure ? Number(row.avgtenure) : null,
            lastfundedsince: row.lastfundedsince || null,

            // Group 5 — Delinquency & Payment Performance
            dpd_bucket: row.dpd_bucket || null,
            deliquency_probability: row.deliquency_probability ? Number(row.deliquency_probability) : null,
          };
          return mapBorrower(raw);
        });

        try {
          localStorage.setItem("borrowerData", JSON.stringify(parsedData));
          setBorrowerList(parsedData);
        } catch (error) {
          console.error("Failed to save to localStorage", error);
          alert("CSV is too large to save in local storage.");
        }
      },
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredBorrowers = useMemo(() => {
    let data = borrowerList;
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
    if (riskFilter !== "all") {
      data = data.filter((b) => b.riskLevel === riskFilter);
    }
    if (industryFilter) {
      data = data.filter((b) => b.industryClean === industryFilter);
    }
    if (stateFilter) {
      data = data.filter((b) => b.state === stateFilter);
    }
    return [...data].sort((a, b) => {
      const va = a[sortKey] ?? 0;
      const vb = b[sortKey] ?? 0;
      return sortDir === "asc" ? va - vb : vb - va;
    });
  }, [query, riskFilter, industryFilter, stateFilter, sortDir, sortKey, borrowerList]);

  const counts = useMemo(
    () => ({
      all: borrowerList.length,
      healthy: borrowerList.filter((b) => b.riskLevel === "healthy").length,
      moderate: borrowerList.filter((b) => b.riskLevel === "moderate").length,
      high: borrowerList.filter((b) => b.riskLevel === "high").length,
    }),
    [borrowerList]
  );

  const paginatedBorrowers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBorrowers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBorrowers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredBorrowers.length / itemsPerPage) || 1;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    const isActive = sortKey === col;
    return (
      <svg
        className={`ml-1 inline-block align-middle text-[10px] ${isActive ? "text-[var(--color-accent)]" : "text-[var(--color-text-tertiary)]"
          }`}
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
      >
        {(!isActive || sortDir === "desc") && (
          <path d="M5 7L2 4h6L5 7z" fill="currentColor" opacity={isActive ? 1 : 0.4} />
        )}
        {(!isActive || sortDir === "asc") && (
          <path d="M5 3l3 3H2L5 3z" fill="currentColor" opacity={isActive ? 1 : 0.4} />
        )}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-8">
        <div className="mx-auto flex h-14 max-w-[1180px] items-center gap-4">
          <div className="text-[15px] font-extrabold tracking-[-0.3px] text-[var(--color-text-primary)]">
            Lend<span className="text-[var(--color-accent)]">{"\u00b7"}</span>IQ
          </div>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <span className="rounded-[var(--radius-full)] bg-[var(--color-accent-bg)] px-[10px] py-[3px] text-[11px] font-semibold tracking-[0.3px] text-[var(--color-accent)]">
            Borrower Intelligence
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
              {borrowerList.length} borrowers
            </span>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[14px] py-[6px] text-xs font-semibold text-[var(--color-text-secondary)] shadow-[var(--shadow-xs)] transition-all hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
            >
              Import CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 md:px-8 md:pt-7 md:pb-10">
        {borrowerList.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-xs)]">
            <div className="mb-4 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[var(--color-accent-bg)] text-[var(--color-accent)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h3 className="mb-2 text-[17px] font-bold tracking-[-0.2px] text-[var(--color-text-primary)]">No Borrower Data Found</h3>
            <p className="mb-6 max-w-[320px] text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">
              Get started by importing your borrower data CSV. Ensure it has standard columns like borrowerid, companybusinessname, and ficoscore.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-[var(--radius-md)] bg-[var(--color-accent)] px-[18px] py-[10px] text-[13px] font-semibold tracking-[0.2px] text-white shadow-md transition-[background,box-shadow] hover:bg-blue-700 hover:shadow-lg"
            >
              Import CSV File
            </button>
          </div>
        ) : (
          <>
            <section className="mb-5 flex flex-wrap items-center gap-[10px]" aria-label="Filters">
              <div className="relative min-w-[260px] flex-1" ref={filterRef}>
                <span
                  className="pointer-events-none absolute left-[14px] top-1/2 flex -translate-y-1/2 items-center text-[var(--color-text-tertiary)]"
                  aria-hidden="true"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="borrower-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, ID, city or state..."
                  autoComplete="off"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] py-[10px] pl-10 pr-[40px] text-[13.5px] font-normal text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] outline-none transition-[border-color,box-shadow] duration-150 ease-[var(--ease-smooth)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(79,110,247,0.1)]"
                />
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="absolute right-[12px] top-1/2 flex -translate-y-1/2 items-center text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                  aria-label="Filter"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                </button>

                {isFilterOpen && (
                  <div className="absolute top-[calc(100%+8px)] right-0 z-30 w-[240px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]">
                    <div className="mb-4">
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">Industry</label>
                      <select
                        value={industryFilter}
                        onChange={(e) => setIndustryFilter(e.target.value)}
                        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">All Industries</option>
                        {uniqueIndustries.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.5px] text-[var(--color-text-secondary)]">State</label>
                      <select
                        value={stateFilter}
                        onChange={(e) => setStateFilter(e.target.value)}
                        className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
                      >
                        <option value="">All States</option>
                        {uniqueStates.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

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
                  className={`${filterPillBase} ${riskFilter === f.key
                      ? "border-[var(--color-accent)] bg-[var(--color-accent-bg)] text-[var(--color-accent)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                    }`}
                  onClick={() => setRiskFilter(f.key)}
                >
                  {f.label}
                  <span className="ml-[5px] opacity-[0.65]">{f.count}</span>
                </button>
              ))}
            </section>

            <section
              className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]"
              aria-label="Borrower list"
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse text-[13.5px] [&_td]:px-[18px] [&_td]:py-[14px] [&_td]:align-middle [&_td]:text-[var(--color-text-secondary)]">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[#fafbfc]">
                      {tableColumns.map((col) => (
                        <th
                          key={col.label}
                          className={`${tableHeaderClass} ${col.key ? "cursor-pointer select-none hover:text-[var(--color-text-primary)]" : ""
                            }`}
                          onClick={col.key ? () => toggleSort(col.key!) : undefined}
                        >
                          {col.label}
                          {col.key && <SortIcon col={col.key} />}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBorrowers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="!p-12 text-center text-[var(--color-text-tertiary)]">
                          No borrowers match your search
                        </td>
                      </tr>
                    ) : (
                      paginatedBorrowers.map((borrower) => (
                        <BorrowerRow
                          key={borrower.borrowerid}
                          borrower={borrower}
                          onSelect={onSelect}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] px-[18px] py-[11px] text-[11.5px] font-medium text-[var(--color-text-tertiary)]">
                <span>
                  Showing {filteredBorrowers.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredBorrowers.length)} of {filteredBorrowers.length} results
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 transition-all disabled:opacity-50 hover:not(:disabled):bg-[#f8fafc]"
                  >
                    Prev
                  </button>
                  <span className="px-2">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-2 py-1 transition-all disabled:opacity-50 hover:not(:disabled):bg-[#f8fafc]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

type BorrowerRowProps = {
  borrower: Borrower;
  onSelect: (borrower: Borrower) => void;
};

function BorrowerRow({ borrower, onSelect }: BorrowerRowProps) {
  const colors = riskColors[borrower.riskLevel];

  return (
    <tr
      id={`borrower-row-${borrower.borrowerid}`}
      onClick={() => onSelect(borrower)}
      className="cursor-pointer border-b border-[var(--color-border-subtle)] transition-[background] duration-[120ms] ease-[var(--ease-smooth)] last:border-b-0 hover:bg-[#f8fafd]"
    >
      <td>
        <div className="flex items-center gap-3">
          <div
            className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[#F1F5F9] text-xs font-bold tracking-[0.5px] text-[#475569]"
          >
            {borrower.initials}
          </div>
          <div>
            <p className="m-0 mb-0.5 text-[13.5px] font-semibold text-[var(--color-text-primary)]">
              {borrower.companybusinessname}
            </p>
            <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
              {borrower.borrowerid}
            </span>
          </div>
        </div>
      </td>

      <td className="text-[13px] text-[var(--color-text-secondary)]">
        {borrower.industryClean}
      </td>

      <td className="text-[13px] text-[var(--color-text-secondary)]">
        {borrower.city}, {borrower.state}
      </td>

      <td>
        <div className="flex items-center gap-[10px]">
          <div className="h-1 w-[52px] flex-shrink-0 overflow-hidden rounded-[var(--radius-full)] bg-[var(--color-border-subtle)]">
            <div
              className="h-full rounded-[var(--radius-full)] transition-[width] duration-[600ms] ease-[var(--ease-smooth)]"
              style={{
                width: `${borrower.borrower_health_index}%`,
                background: colors.dot,
              }}
            />
          </div>
          <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
            {borrower.borrower_health_index}
          </span>
        </div>
      </td>

      <td>
        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
          {borrower.ficoscore ?? "\u2014"}
        </span>
      </td>

      <td>
        <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
          ${(borrower.total_loan_amount / 1000).toFixed(0)}K
        </span>
      </td>

      <td>
        <span
          className={`text-[13px] font-semibold ${borrower.maxdpd > 30
              ? "text-[var(--color-risk-high)]"
              : borrower.maxdpd > 0
                ? "text-[var(--color-risk-moderate)]"
                : "text-[var(--color-risk-healthy)]"
            }`}
        >
          {borrower.maxdpd}d
        </span>
      </td>

      <td>
        <span
          className="inline-flex whitespace-nowrap rounded-[var(--radius-full)] border px-[10px] py-[3px] text-[11px] font-bold tracking-[0.3px]"
          style={{
            background: colors.bg,
            color: colors.text,
            borderColor: colors.border,
          }}
        >
          {borrower.riskLabel}
        </span>
      </td>
    </tr>
  );
}
