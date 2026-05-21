// src/components/shared/BorrowerCard.tsx
//
// Single variant-based borrower display component.
// variant: "dense"    → full data table row (workspace mode)
// variant: "compact"  → minimal identity strip (intelligence sidebar)
// variant: "expanded" → full detail overlay (intelligence detail view)
//
// ONE component — never fork into DenseRow / CompactRow / ExpandedCard.

import { memo } from "react";
import { riskColors } from "../../constants/risk";
import { zones } from "../../constants/zones";
import { getZoneMetrics, getZoneSeverity } from "../../utils/zoneMetrics";
import type { Borrower } from "../../types/borrower";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BorrowerCardVariant = "dense" | "compact" | "expanded";

export interface BorrowerCardProps {
  borrower: Borrower;
  variant: BorrowerCardVariant;
  isSelected?: boolean;
  onSelect?: (b: Borrower) => void;
  onClose?: () => void; // expanded variant dismiss
}

// ─── BorrowerCard ──────────────────────────────────────────────────────────────

export const BorrowerCard = memo(function BorrowerCard({
  borrower,
  variant,
  isSelected = false,
  onSelect,
  onClose,
}: BorrowerCardProps) {
  const colors = riskColors[borrower.riskLevel];

  if (variant === "dense") {
    return (
      <DenseVariant
        borrower={borrower}
        colors={colors}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    );
  }

  if (variant === "compact") {
    return (
      <CompactVariant
        borrower={borrower}
        colors={colors}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    );
  }

  return (
    <ExpandedVariant
      borrower={borrower}
      colors={colors}
      onClose={onClose}
    />
  );
});

// ─── Helper types ──────────────────────────────────────────────────────────────

type ColorSet = ReturnType<typeof getRiskColors>;
function getRiskColors(b: Borrower) {
  return riskColors[b.riskLevel];
}

// ─── Dense variant (table row) ─────────────────────────────────────────────────

function DenseVariant({
  borrower,
  colors,
  isSelected,
  onSelect,
}: {
  borrower: Borrower;
  colors: ColorSet;
  isSelected: boolean;
  onSelect?: (b: Borrower) => void;
}) {
  return (
    <tr
      id={`borrower-row-${borrower.borrowerid}`}
      onClick={() => onSelect?.(borrower)}
      className={[
        "cursor-pointer border-b border-[var(--color-border-subtle)] transition-colors duration-[100ms] last:border-b-0",
        isSelected ? "bg-[var(--color-accent-bg)]" : "hover:bg-[#f8fafd]",
      ].join(" ")}
    >
      {/* Business */}
      <td className="px-4 py-[12px] align-middle">
        <div className="flex items-center gap-2.5">
          <div
            className={[
              "flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] text-[10.5px] font-bold",
              isSelected
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[#F1F5F9] text-[#475569]",
            ].join(" ")}
          >
            {borrower.initials}
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-[var(--color-text-primary)]">
              {borrower.companybusinessname}
            </p>
            <span className="text-[10.5px] text-[var(--color-text-tertiary)]">
              {borrower.borrowerid}
            </span>
          </div>
        </div>
      </td>

      {/* Industry */}
      <td className="px-4 py-[12px] align-middle text-[12px] text-[var(--color-text-secondary)]">
        {borrower.industryClean}
      </td>

      {/* Location */}
      <td className="px-4 py-[12px] align-middle text-[12px] text-[var(--color-text-secondary)]">
        {borrower.city}, {borrower.state}
      </td>

      {/* Health Index */}
      <td className="px-4 py-[12px] align-middle">
        <div className="flex items-center gap-2">
          <div className="h-1 w-[44px] overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${borrower.borrower_health_index}%`,
                background: colors.dot,
              }}
            />
          </div>
          <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
            {borrower.borrower_health_index}
          </span>
        </div>
      </td>

      {/* FICO */}
      <td className="px-4 py-[12px] align-middle">
        <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
          {borrower.ficoscore ?? "—"}
        </span>
      </td>

      {/* Loans */}
      <td className="px-4 py-[12px] align-middle">
        <span className="text-[12px] font-medium text-[var(--color-text-primary)]">
          ${(borrower.total_loan_amount / 1000).toFixed(0)}K
        </span>
      </td>

      {/* Max DPD */}
      <td className="px-4 py-[12px] align-middle">
        <span
          className={`text-[12px] font-semibold ${
            borrower.maxdpd > 30
              ? "text-[var(--color-risk-high)]"
              : borrower.maxdpd > 0
                ? "text-[var(--color-risk-moderate)]"
                : "text-[var(--color-risk-healthy)]"
          }`}
        >
          {borrower.maxdpd}d
        </span>
      </td>

      {/* Risk */}
      <td className="px-4 py-[12px] align-middle">
        <span
          className="inline-flex rounded-full border px-[9px] py-[2px] text-[10.5px] font-bold tracking-[0.2px]"
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

// ─── Compact variant (sidebar identity strip) ──────────────────────────────────

function CompactVariant({
  borrower,
  colors,
  isSelected,
  onSelect,
}: {
  borrower: Borrower;
  colors: ColorSet;
  isSelected: boolean;
  onSelect?: (b: Borrower) => void;
}) {
  return (
    <button
      id={`condensed-row-${borrower.borrowerid}`}
      onClick={() => onSelect?.(borrower)}
      className={[
        "flex w-full items-center gap-2.5 border-b border-[var(--color-border-subtle)] px-3 py-2.5 text-left transition-colors duration-100",
        isSelected ? "bg-[var(--color-accent-bg)]" : "hover:bg-[#f8fafd]",
      ].join(" ")}
    >
      {/* Avatar */}
      <div
        className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] text-[11px] font-bold"
        style={{
          background: isSelected ? "var(--color-accent)" : "#F1F5F9",
          color: isSelected ? "#fff" : "#475569",
        }}
      >
        {borrower.initials}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11.5px] font-semibold leading-tight text-[var(--color-text-primary)]">
          {borrower.companybusinessname}
        </p>
        <p className="truncate text-[10px] font-medium text-[var(--color-text-tertiary)]">
          {borrower.industryClean}
        </p>
      </div>

      {/* Health score pill */}
      <div
        className="flex-shrink-0 rounded-[5px] px-[6px] py-[2px] text-[10px] font-bold"
        style={{ background: colors.ring, color: colors.dot }}
      >
        {borrower.borrower_health_index}
      </div>
    </button>
  );
}

// ─── Expanded variant (detail overlay) ─────────────────────────────────────────

function ExpandedVariant({
  borrower,
  colors,
  onClose,
}: {
  borrower: Borrower;
  colors: ColorSet;
  onClose?: () => void;
}) {
  const zoneSummaries = zones.map((zone) => {
    const metrics = getZoneMetrics(borrower, zone.id);
    const severity = getZoneSeverity(borrower, zone.id);
    const availableCount = metrics.filter((m) => !m.isMissing).length;
    return { zone, metrics, severity, availableCount, total: metrics.length };
  });

  return (
    <div className="flex max-h-[80vh] w-[380px] flex-col overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_8px_32px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.06)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-5 py-4">
        <div
          className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center rounded-[10px] text-[14px] font-bold"
          style={{ background: colors.ring, color: colors.dot }}
        >
          {borrower.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[14px] font-bold text-[var(--color-text-primary)]">
            {borrower.companybusinessname}
          </h3>
          <p className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
            {borrower.borrowerid} · {borrower.city}, {borrower.state}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[#f1f5f9]"
          >
            ×
          </button>
        )}
      </div>

      {/* KPI strip */}
      <div className="flex items-center gap-4 border-b border-[var(--color-border-subtle)] px-5 py-3">
        <KpiItem
          label="Health"
          value={String(borrower.borrower_health_index)}
          color={colors.dot}
        />
        <div className="h-[18px] w-px bg-[var(--color-border)]" />
        <KpiItem label="FICO" value={String(borrower.ficoscore ?? "—")} />
        <div className="h-[18px] w-px bg-[var(--color-border)]" />
        <KpiItem
          label="Loans"
          value={`$${(borrower.total_loan_amount / 1000).toFixed(0)}K`}
        />
        <div className="h-[18px] w-px bg-[var(--color-border)]" />
        <span
          className="ml-auto rounded-full border-[1.5px] px-[9px] py-[2px] text-[10px] font-bold uppercase"
          style={{
            background: colors.bg,
            color: colors.text,
            borderColor: colors.border,
          }}
        >
          {borrower.riskLabel}
        </span>
      </div>

      {/* Zone breakdown */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <div className="flex flex-col gap-3">
          {zoneSummaries.map(({ zone, severity, availableCount, total }) => {
            const sevColor =
              severity === "good"
                ? "#16A34A"
                : severity === "bad"
                  ? "#DC2626"
                  : "#64748B";
            return (
              <div
                key={zone.id}
                className="flex items-center gap-2.5 rounded-[8px] border border-[var(--color-border-subtle)] px-3 py-2.5"
              >
                <span className="text-[14px]">{zone.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold text-[var(--color-text-primary)]">
                    {zone.label}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {availableCount}/{total} metrics available
                  </p>
                </div>
                <div
                  className="h-[6px] w-[6px] rounded-full"
                  style={{ background: sevColor }}
                />
              </div>
            );
          })}
        </div>

        {/* Detail fields */}
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.5px] text-[var(--color-text-tertiary)]">
            Profile
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <DetailField label="Industry" value={borrower.industryClean} />
            <DetailField
              label="Revenue"
              value={borrower.revenueLabel}
            />
            <DetailField
              label="Time in Business"
              value={`${borrower.timeinbusiness} mo`}
            />
            <DetailField
              label="Active Loans"
              value={String(borrower.active_loans)}
            />
            <DetailField label="Max DPD" value={`${borrower.maxdpd}d`} />
            <DetailField label="Avg DPD" value={`${borrower.avgdpd}d`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function KpiItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-bold uppercase tracking-[0.3px] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span
        className="text-[13px] font-bold"
        style={{ color: color ?? "var(--color-text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.3px] text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <p className="text-[11.5px] font-semibold text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
