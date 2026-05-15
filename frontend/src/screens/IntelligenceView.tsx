import { useState, useRef, useCallback, useEffect } from "react";
import { RadialGraph } from "../components/RadialGraph";
import { InsightCard } from "../components/InsightCard";
import { riskColors } from "../constants/risk";
import type { Borrower } from "../types/borrower";
import type { ZoneMetric } from "../types/borrower";

type IntelligenceViewProps = {
  borrower: Borrower;
  onBack: () => void;
};

type InsightState = {
  metric: ZoneMetric;
  x: number;
  y: number;
} | null;

const headerSepClass = "h-[18px] w-px flex-shrink-0 bg-[var(--color-border)]";
const headerKpiClass = "hidden items-center gap-1.5 md:flex";
const headerKpiLabelClass =
  "text-[11.5px] font-semibold uppercase tracking-[0.2px] text-[var(--color-text-tertiary)]";
const headerKpiValueClass =
  "text-sm font-bold text-[var(--color-text-primary)]";

export function IntelligenceView({ borrower, onBack }: IntelligenceViewProps) {
  const riskColor = riskColors[borrower.riskLevel];
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 680 });
  const [insight, setInsight] = useState<InsightState>(null);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMetricClick = useCallback(
    (metric: ZoneMetric, x: number, y: number) => {
      setInsight({ metric, x, y });
    },
    [],
  );

  const closeInsight = useCallback(() => setInsight(null), []);
  const displayName = borrower.companybusinessname;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:p-6 md:p-8"
      onClick={onBack}
    >
      <div
        className="relative flex h-full w-full max-w-[1400px] flex-col overflow-hidden rounded-2xl bg-[var(--color-bg)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <style>{`
          @keyframes modalSlideIn {
            0% { opacity: 0; transform: scale(0.96) translateY(12px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
        <header className="relative z-30 flex h-[60px] flex-shrink-0 items-center gap-4 border-b border-[var(--color-border)] bg-[rgba(255,255,255,0.92)] px-7 shadow-[var(--shadow-xs)] backdrop-blur-xl">
          <button
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-transparent px-[14px] py-[7px] text-[13px] font-semibold tracking-[0.1px] text-[var(--color-text-secondary)] transition-all duration-150 ease-[var(--ease-smooth)] hover:border-[#cbd5e1] hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)]"
            onClick={onBack}
            id="close-intelligence-view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Close
          </button>

          <div className={headerSepClass} />

          <div>
            <div className="text-[15px] font-bold tracking-[-0.3px] text-[var(--color-text-primary)]">
              {displayName}
            </div>
            <div className="text-[12.5px] font-medium text-[var(--color-text-tertiary)]">
              {borrower.borrowerid} {"\u00b7"} {borrower.city}, {borrower.state}
            </div>
          </div>

          <div className="flex-1" />

          <div className={headerKpiClass}>
            <span className={headerKpiLabelClass}>FICO</span>
            <span className={headerKpiValueClass}>
              {borrower.ficoscore ?? "\u2014"}
            </span>
          </div>

          <div className={headerSepClass} />

          <div className={headerKpiClass}>
            <span className={headerKpiLabelClass}>Loans</span>
            <span className={headerKpiValueClass}>
              ${(borrower.total_loan_amount / 1000).toFixed(0)}K
            </span>
          </div>

          <div className={headerSepClass} />

          <div className={headerKpiClass}>
            <span className={headerKpiLabelClass}>Industry</span>
            <span className={headerKpiValueClass}>
              {borrower.industryClean}
            </span>
          </div>

          <div className={headerSepClass} />

          <span
            className="rounded-[var(--radius-full)] border-[1.5px] px-[14px] py-[5px] text-[11.5px] font-bold uppercase tracking-[0.5px]"
            style={{
              background: riskColor.bg,
              color: riskColor.text,
              borderColor: riskColor.border,
            }}
          >
            {borrower.riskLabel}
          </span>
        </header>

        <div
          className="relative flex-1 overflow-hidden shadow-[inset_0_0_80px_rgba(15,23,42,0.025)] [&_svg]:block [&_svg]:h-full [&_svg]:w-full"
          ref={canvasRef}
        >
          {canvasSize.width > 0 && (
            <RadialGraph
              borrower={borrower}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              onMetricClick={handleMetricClick}
            />
          )}

          {insight && (
            <div className="pointer-events-none absolute inset-0 z-20">
              <InsightCard
                metric={insight.metric}
                x={insight.x}
                y={insight.y}
                canvasWidth={canvasSize.width}
                canvasHeight={canvasSize.height}
                onClose={closeInsight}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
