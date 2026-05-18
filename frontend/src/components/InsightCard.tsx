import { useEffect, useRef } from "react";
import { severityStyle } from "../constants/risk";
import type { ZoneMetric } from "../types/borrower";

type InsightCardProps = {
  metric: ZoneMetric;
  x: number;
  y: number;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
};

const CARD_WIDTH = 260;
const CARD_HEIGHT = 210;
const MARGIN = 16;

export function InsightCard({ metric, x, y, canvasWidth, canvasHeight, onClose }: InsightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const style = severityStyle[metric.severity];

  let left = x + 18;
  let top = y - 90;
  if (left + CARD_WIDTH + MARGIN > canvasWidth) left = x - CARD_WIDTH - 18;
  if (left < MARGIN) left = MARGIN;
  if (top + CARD_HEIGHT + MARGIN > canvasHeight) top = canvasHeight - CARD_HEIGHT - MARGIN;
  if (top < MARGIN) top = MARGIN;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const severityLabel =
    metric.isMissing ? "No Data"
      : metric.severity === "good" ? "Positive Signal"
      : metric.severity === "bad" ? "Risk Flag"
        : "Neutral";

  const dotColor =
    metric.isMissing ? "#94A3B8"
      : metric.severity === "good" ? "#16A34A"
      : metric.severity === "bad" ? "#DC2626"
        : "#6B7280";

  const accentBg =
    metric.isMissing ? "rgba(148,163,184,0.12)"
      : metric.severity === "good" ? "rgba(22,163,74,0.06)"
      : metric.severity === "bad" ? "rgba(220,38,38,0.06)"
        : "rgba(100,116,139,0.06)";

  return (
    <div
      ref={cardRef}
      className="pointer-events-auto absolute w-[200px] overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_4px_6px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.1),0_1px_0_rgba(255,255,255,0.8)_inset] [animation:insight-appear_0.22s_cubic-bezier(0.34,1.56,0.64,1)] md:w-[264px]"
      style={{ left, top }}
    >
      <div className="h-1 w-full rounded-none" style={{ background: dotColor }} />

      <button
        className="absolute right-[14px] top-[14px] flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-0 text-lg text-[var(--color-text-tertiary)] transition-all duration-150 ease-[var(--ease-smooth)] hover:border-[#cbd5e1] hover:bg-[#f1f5f9] hover:text-[var(--color-text-primary)]"
        onClick={onClose}
        aria-label="Close"
      >
        {"\u00d7"}
      </button>

      <div className="mb-1.5 px-[18px] pt-4 text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-tertiary)]">
        {metric.label}
      </div>

      <div className="mb-1 flex items-end gap-[10px] px-[18px]">
        <div className={`text-[32px] font-extrabold leading-none tracking-[-1.5px] ${metric.isMissing ? "text-[var(--color-text-tertiary)]" : "text-[var(--color-text-primary)]"}`}>
          {metric.value}
        </div>
        <div
          className="mb-1 inline-flex items-center gap-[5px] rounded-[999px] py-[3px] pl-[7px] pr-[10px] text-[11.5px] font-bold tracking-[0.1px]"
          style={{ background: accentBg, color: style.text }}
        >
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: dotColor }} />
          {severityLabel}
        </div>
      </div>

      <div className="mb-3 px-[18px] text-[12.5px] font-medium text-[var(--color-text-tertiary)]">
        {metric.sub}
      </div>
      <hr className="mx-[18px] mb-3 mt-0 h-px border-0 bg-[var(--color-border-subtle)]" />
      <p className="m-0 px-[18px] pb-[18px] text-[13px] font-normal leading-[1.65] text-[var(--color-text-secondary)]">
        {metric.interpretation}
      </p>
    </div>
  );
}
