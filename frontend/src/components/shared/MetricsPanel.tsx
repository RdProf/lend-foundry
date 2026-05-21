// src/components/shared/MetricsPanel.tsx
//
// Single variant-based metrics display.
// variant: "summary"  → compact horizontal strip with key KPIs
// variant: "detailed" → full grid of all zone metrics with severity + interpretations
//
// Both variants read the same borrower data — no duplication.
// ONE component, never fork into SummaryMetrics / DetailedMetrics.

import { memo, useMemo } from "react";
import { zones } from "../../constants/zones";
import { riskColors } from "../../constants/risk";
import { getZoneMetrics, getZoneSeverity } from "../../utils/zoneMetrics";
import type { Borrower, ZoneMetric, MetricSeverity } from "../../types/borrower";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MetricsPanelVariant = "summary" | "detailed";

export interface MetricsPanelProps {
  borrower: Borrower;
  variant: MetricsPanelVariant;
  className?: string;
}

// ─── MetricsPanel ──────────────────────────────────────────────────────────────

export const MetricsPanel = memo(function MetricsPanel({
  borrower,
  variant,
  className = "",
}: MetricsPanelProps) {
  if (variant === "summary") {
    return <SummaryVariant borrower={borrower} className={className} />;
  }
  return <DetailedVariant borrower={borrower} className={className} />;
});

// ─── Summary variant ───────────────────────────────────────────────────────────

function SummaryVariant({
  borrower,
  className,
}: {
  borrower: Borrower;
  className: string;
}) {
  const colors = riskColors[borrower.riskLevel];

  const kpis: Array<{ label: string; value: string; color?: string }> = [
    {
      label: "Health",
      value: String(borrower.borrower_health_index),
      color: colors.dot,
    },
    { label: "FICO", value: String(borrower.ficoscore ?? "—") },
    {
      label: "Loans",
      value: `$${(borrower.total_loan_amount / 1000).toFixed(0)}K`,
    },
    { label: "DPD", value: `${borrower.maxdpd}d` },
    { label: "Active", value: String(borrower.active_loans) },
  ];

  return (
    <div
      className={`flex items-center gap-3 ${className}`}
    >
      {kpis.map((kpi, i) => (
        <div key={kpi.label} className="flex items-center gap-3">
          {i > 0 && (
            <div className="h-[14px] w-px bg-[var(--color-border)]" />
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.2px] text-[var(--color-text-tertiary)]">
              {kpi.label}
            </span>
            <span
              className="text-[12px] font-bold"
              style={{ color: kpi.color ?? "var(--color-text-primary)" }}
            >
              {kpi.value}
            </span>
          </div>
        </div>
      ))}

      <div className="h-[14px] w-px bg-[var(--color-border)]" />
      <span
        className="rounded-full border-[1.5px] px-[10px] py-[3px] text-[10.5px] font-bold uppercase tracking-[0.4px]"
        style={{
          background: colors.bg,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        {borrower.riskLabel}
      </span>
    </div>
  );
}

// ─── Detailed variant ──────────────────────────────────────────────────────────

function DetailedVariant({
  borrower,
  className,
}: {
  borrower: Borrower;
  className: string;
}) {
  const zoneData = useMemo(
    () =>
      zones.map((zone) => ({
        zone,
        metrics: getZoneMetrics(borrower, zone.id),
        severity: getZoneSeverity(borrower, zone.id),
      })),
    [borrower]
  );

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {zoneData.map(({ zone, metrics, severity }) => (
        <ZoneSection
          key={zone.id}
          label={zone.label}
          icon={zone.icon}
          severity={severity}
          metrics={metrics}
        />
      ))}
    </div>
  );
}

// ─── Zone section ──────────────────────────────────────────────────────────────

function ZoneSection({
  label,
  icon,
  severity,
  metrics,
}: {
  label: string;
  icon: string;
  severity: MetricSeverity;
  metrics: ZoneMetric[];
}) {
  const sevColor =
    severity === "good"
      ? "#16A34A"
      : severity === "bad"
        ? "#DC2626"
        : "#64748B";

  return (
    <div className="rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface)]">
      {/* Zone header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border-subtle)] px-3 py-2.5">
        <span className="text-[13px]">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.3px] text-[var(--color-text-primary)]">
          {label}
        </span>
        <div
          className="ml-auto h-[6px] w-[6px] rounded-full"
          style={{ background: sevColor }}
        />
      </div>

      {/* Metric rows */}
      <div className="divide-y divide-[var(--color-border-subtle)]">
        {metrics.map((metric) => (
          <MetricRow key={metric.column ?? metric.label} metric={metric} />
        ))}
      </div>
    </div>
  );
}

// ─── Metric row ────────────────────────────────────────────────────────────────

function MetricRow({
  metric,
}: {
  metric: ZoneMetric;
}) {
  const sevDot =
    metric.isMissing
      ? "#94A3B8"
      : metric.severity === "good"
        ? "#16A34A"
        : metric.severity === "bad"
          ? "#DC2626"
          : "#64748B";

  return (
    <div
      className={[
        "flex items-start gap-2.5 px-3 py-2.5",
        metric.isMissing ? "opacity-55" : "",
      ].join(" ")}
    >
      {/* Severity dot */}
      <div
        className="mt-[5px] h-[5px] w-[5px] flex-shrink-0 rounded-full"
        style={{ background: sevDot }}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-baseline gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.3px] text-[var(--color-text-secondary)]">
            {metric.label}
          </span>
          <span
            className="text-[12.5px] font-bold"
            style={{
              color: metric.isMissing
                ? "var(--color-text-tertiary)"
                : "var(--color-text-primary)",
            }}
          >
            {metric.value}
          </span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-[var(--color-text-tertiary)]">
          {metric.interpretation}
        </p>
      </div>
    </div>
  );
}
