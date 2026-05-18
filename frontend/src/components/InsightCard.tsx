import { useEffect, useLayoutEffect, useRef, useState } from "react";
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

const MARGIN = 16;

export function InsightCard({
  metric,
  x,
  y,
  canvasWidth,
  canvasHeight,
  onClose,
}: InsightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const getCardWidth = () => {
    const textLength =
      `${metric.label} ${metric.sub} ${metric.interpretation}`.length;

    if (textLength > 220) return 330;
    if (textLength > 140) return 290;

    return 250;
  };

  const cardWidth = getCardWidth();

  const [position, setPosition] = useState({
    left: x,
    top: y,
  });

  const style = severityStyle[metric.severity];

  useLayoutEffect(() => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const cardHeight = rect.height;

    let left = x + 18;

    // vertically center card around click point
    let top = y - cardHeight / 2;

    // flip to left side if overflowing right
    if (left + cardWidth + MARGIN > canvasWidth) {
      left = x - cardWidth - 18;
    }

    // clamp left edge
    if (left < MARGIN) {
      left = MARGIN;
    }

    // clamp right edge
    if (left + cardWidth + MARGIN > canvasWidth) {
      left = canvasWidth - cardWidth - MARGIN;
    }

    // clamp bottom edge
    if (top + cardHeight + MARGIN > canvasHeight) {
      top = canvasHeight - cardHeight - MARGIN;
    }

    // clamp top edge
    if (top < MARGIN) {
      top = MARGIN;
    }

    setPosition({ left, top });
  }, [x, y, canvasWidth, canvasHeight, cardWidth]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handler);

    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        cardRef.current &&
        !cardRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handler);
    }, 50);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const severityLabel = metric.isMissing
    ? "No Data"
    : metric.severity === "good"
      ? "Positive Signal"
      : metric.severity === "bad"
        ? "Risk Flag"
        : "Neutral";

  const dotColor = metric.isMissing
    ? "#94A3B8"
    : metric.severity === "good"
      ? "#16A34A"
      : metric.severity === "bad"
        ? "#DC2626"
        : "#6B7280";

  const borderColor = metric.isMissing
    ? "#CBD5E1"
    : metric.severity === "good"
      ? "#22C55E"
      : metric.severity === "bad"
        ? "#EF4444"
        : "#CBD5E1";

  return (
    <div
      ref={cardRef}
      className="pointer-events-auto absolute z-50 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 shadow-[0_4px_6px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.1),0_1px_0_rgba(255,255,255,0.8)_inset] [animation:insight-appear_0.22s_cubic-bezier(0.34,1.56,0.64,1)]"
      style={{
        width: `${cardWidth}px`,
        left: position.left,
        top: position.top,
      }}
    >
      {/* Top Accent Bar */}
      <div
        className="h-1 w-full rounded-none"
        style={{ background: dotColor }}
      />

      {/* Close Button */}
      <button
        className="absolute right-[14px] top-[14px] flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] p-0 text-lg text-[var(--color-text-tertiary)] transition-all duration-150 ease-[var(--ease-smooth)] hover:border-[#cbd5e1] hover:bg-[#f1f5f9] hover:text-[var(--color-text-primary)]"
        onClick={onClose}
        aria-label="Close"
      >
        {"\u00d7"}
      </button>

      {/* Metric Label */}
      <div className="mb-1.5 px-[18px] pt-4 text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-tertiary)]">
        {metric.label}
      </div>

      {/* Value + Severity */}
      <div className="mb-1 flex flex-wrap items-end gap-[10px] px-[18px]">
        <div
          className={`break-words text-[32px] font-extrabold leading-none tracking-[-1.5px] ${metric.isMissing
              ? "text-[var(--color-text-tertiary)]"
              : "text-[var(--color-text-primary)]"
            }`}
        >
          {metric.value}
        </div>

        <div
          className="mb-1 inline-flex items-center gap-[5px] rounded-[999px] border py-[2px] pl-[7px] pr-[10px] text-[11px] font-bold tracking-[0.1px]"
          style={{
            background: "#FFFFFF",
            color: style.text,
            borderColor,
          }}
        >
          <span
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
            style={{ background: dotColor }}
          />

          {severityLabel}
        </div>
      </div>

      {/* Sub Label */}
      <div className="mb-3 px-[18px] text-[12.5px] font-medium text-[var(--color-text-tertiary)]">
        {metric.sub}
      </div>

      <hr className="mx-[18px] mb-3 mt-0 h-px border-0 bg-[var(--color-border-subtle)]" />

      {/* Interpretation */}
      <p className="m-0 break-words px-[18px] pb-[18px] text-[13px] font-normal leading-[1.65] text-[var(--color-text-secondary)]">
        {metric.interpretation}
      </p>
    </div>
  );
}