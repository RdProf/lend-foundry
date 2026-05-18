import type { Borrower, CsvCellValue, MetricSeverity, ZoneMetric } from "../types/borrower";
import type { ZoneId } from "../constants/zones";

type MetricInput = {
  column: string;
  label: string;
  value: string;
  sub: string;
  severity: MetricSeverity;
  interpretation: string;
};

export const graphMetricColumns = [
  "borrowerid",
  "companybusinessname",
  "city",
  "state",
  "industry",
  "ficoscore",
  "timeinbusiness",
  "latestannualrevenue",
  "total_loan_amount",
  "active_loans",
  "maxdpd",
  "avgdpd",
  "repayment_score",
  "stability_score",
  "exposure_score",
  "business_size_score",
  "borrower_health_index",
  "avgannualinterestrate",
] as const;

export const graphMetricColumnSet = new Set<string>(graphMetricColumns);

export function getZoneMetrics(borrower: Borrower, zoneId: ZoneId): ZoneMetric[] {
  if (zoneId === "credit") {
    return [
      metric(borrower, {
        column: "ficoscore",
        label: "FICO Score",
        value: borrower.ficoscore ? `${borrower.ficoscore}` : "NIL",
        sub: borrower.ficoLabel,
        severity: borrower.ficoscore && borrower.ficoscore >= 700 ? "good" : borrower.ficoscore && borrower.ficoscore >= 650 ? "neutral" : "bad",
        interpretation: borrower.ficoscore
          ? borrower.ficoscore >= 750
            ? "Excellent credit quality. Low default probability."
            : borrower.ficoscore >= 700
              ? "Good credit standing. Standard risk profile."
              : borrower.ficoscore >= 650
                ? "Fair credit. Monitor for deterioration."
                : "Poor credit score. Elevated default risk."
          : "No FICO data available. Assess manually.",
      }),
      metric(borrower, {
        column: "maxdpd",
        label: "Max DPD",
        value: `${borrower.maxdpd} days`,
        sub: borrower.maxdpd === 0 ? "No delinquency" : "Peak days past due",
        severity: borrower.maxdpd === 0 ? "good" : borrower.maxdpd <= 7 ? "neutral" : "bad",
        interpretation:
          borrower.maxdpd === 0
            ? "No missed payments. Strong payment discipline."
            : borrower.maxdpd <= 7
              ? "Minor delay. Likely situational, not systemic."
              : borrower.maxdpd <= 30
                ? "Moderate delinquency. Warrants closer monitoring."
                : "Severe delinquency. High collection risk.",
      }),
      metric(borrower, {
        column: "avgdpd",
        label: "Avg DPD",
        value: `${borrower.avgdpd} days`,
        sub: "Average days past due",
        severity: borrower.avgdpd === 0 ? "good" : borrower.avgdpd <= 5 ? "neutral" : "bad",
        interpretation:
          borrower.avgdpd === 0
            ? "Consistently on-time. Reliable payment pattern."
            : borrower.avgdpd <= 5
              ? "Slight average delay. Acceptable risk level."
              : "Recurring late payments. Behavioral risk signal.",
      }),
    ];
  }

  if (zoneId === "health") {
    return [
      metric(borrower, {
        column: "borrower_health_index",
        label: "Health Index",
        value: `${borrower.borrower_health_index}`,
        sub: borrower.riskLabel,
        severity: borrower.borrower_health_index >= 65 ? "good" : borrower.borrower_health_index >= 55 ? "neutral" : "bad",
        interpretation:
          borrower.borrower_health_index >= 65
            ? "Strong borrower profile. Favorable lending candidate."
            : borrower.borrower_health_index >= 55
              ? "Moderate health. Proceed with standard due diligence."
              : "Below threshold. High-risk borrower profile.",
      }),
      metric(borrower, {
        column: "stability_score",
        label: "Stability Score",
        value: `${borrower.stability_score}`,
        sub: "Business stability rating",
        severity: borrower.stability_score >= 60 ? "good" : borrower.stability_score >= 30 ? "neutral" : "bad",
        interpretation:
          borrower.stability_score >= 60
            ? "Established and stable business operations."
            : borrower.stability_score >= 30
              ? "Moderate stability. Some operational volatility."
              : "Low stability. Young or fragile business structure.",
      }),
      metric(borrower, {
        column: "timeinbusiness",
        label: "Time in Business",
        value: `${Math.round(borrower.timeinbusiness / 12)} yrs`,
        sub: `${borrower.timeinbusiness} months`,
        severity: borrower.timeinbusiness >= 120 ? "good" : borrower.timeinbusiness >= 60 ? "neutral" : "bad",
        interpretation:
          borrower.timeinbusiness >= 120
            ? "10+ years operating. Proven business resilience."
            : borrower.timeinbusiness >= 60
              ? "5-10 years. Established but still maturing."
              : "Under 5 years. Higher early-stage risk.",
      }),
      metric(borrower, {
        column: "business_size_score",
        label: "Business Size",
        value: `${borrower.business_size_score}`,
        sub: "Business size score",
        severity: borrower.business_size_score >= 60 ? "good" : borrower.business_size_score >= 30 ? "neutral" : "bad",
        interpretation:
          borrower.business_size_score >= 60
            ? "Larger operating profile. More capacity to absorb volatility."
            : borrower.business_size_score >= 30
              ? "Mid-sized profile. Capacity should be reviewed against exposure."
              : "Small business profile. Debt capacity may be limited.",
      }),
    ];
  }

  if (zoneId === "exposure") {
    return [
      metric(borrower, {
        column: "total_loan_amount",
        label: "Total Loans",
        value: `$${(borrower.total_loan_amount / 1000).toFixed(0)}K`,
        sub: "Total disbursed amount",
        severity: borrower.total_loan_amount < 50_000 ? "good" : borrower.total_loan_amount < 200_000 ? "neutral" : "bad",
        interpretation:
          borrower.total_loan_amount < 50_000
            ? "Low exposure. Minimal portfolio risk."
            : borrower.total_loan_amount < 200_000
              ? "Moderate loan volume. Normal exposure range."
              : "High loan volume. Concentration risk elevated.",
      }),
      metric(borrower, {
        column: "active_loans",
        label: "Active Loans",
        value: `${borrower.active_loans}`,
        sub: borrower.active_loans === 0 ? "Fully repaid" : "Currently outstanding",
        severity: borrower.active_loans === 0 ? "good" : "neutral",
        interpretation:
          borrower.active_loans === 0
            ? "No outstanding balances. Clean repayment record."
            : `${borrower.active_loans} loan(s) currently active. Monitor repayment cadence.`,
      }),
      metric(borrower, {
        column: "exposure_score",
        label: "Exposure Score",
        value: `${borrower.exposure_score}`,
        sub: "Portfolio exposure rating",
        severity: borrower.exposure_score <= 20 ? "good" : borrower.exposure_score <= 50 ? "neutral" : "bad",
        interpretation:
          borrower.exposure_score <= 20
            ? "Low systemic exposure. Conservative profile."
            : borrower.exposure_score <= 50
              ? "Moderate exposure. Within acceptable range."
              : "High exposure score. Risk management attention needed.",
      }),
    ];
  }

  if (zoneId === "behavior") {
    return [
      metric(borrower, {
        column: "repayment_score",
        label: "Repayment Score",
        value: `${borrower.repayment_score}`,
        sub: borrower.repayment_score >= 90 ? "Excellent repayment" : "Needs review",
        severity: borrower.repayment_score >= 90 ? "good" : borrower.repayment_score >= 70 ? "neutral" : "bad",
        interpretation:
          borrower.repayment_score >= 90
            ? "Near-perfect repayment behavior. Strong signal."
            : borrower.repayment_score >= 70
              ? "Acceptable repayment. Some inconsistency present."
              : "Poor repayment history. High behavioral risk.",
      }),
      metric(borrower, {
        column: "avgannualinterestrate",
        label: "Avg Interest Rate",
        value: `${borrower.avgannualinterestrate.toFixed(1)}%`,
        sub: "Average annual rate",
        severity: borrower.avgannualinterestrate <= 30 ? "good" : borrower.avgannualinterestrate <= 60 ? "neutral" : "bad",
        interpretation:
          borrower.avgannualinterestrate <= 30
            ? "Low rate indicates strong creditworthiness history."
            : borrower.avgannualinterestrate <= 60
              ? "Mid-range rate. Typical for SMB lending."
              : "High interest rate. Suggests prior risk-adjusted pricing.",
      }),
    ];
  }

  return [
    metric(borrower, {
      column: "borrowerid",
      label: "Borrower ID",
      value: borrower.borrowerid,
      sub: "Unique borrower identifier",
      severity: "neutral",
      interpretation: "Identifier used to connect this record to the source borrower data.",
    }),
    metric(borrower, {
      column: "companybusinessname",
      label: "Company Name",
      value: borrower.companybusinessname,
      sub: "Business name",
      severity: "neutral",
      interpretation: "Business identity from the imported borrower record.",
    }),
    metric(borrower, {
      column: "industry",
      label: "Industry",
      value: borrower.industryClean,
      sub: "Operating sector",
      severity: "neutral",
      interpretation: `Operating in ${borrower.industryClean}. Industry context affects risk modeling and sector-specific volatility.`,
    }),
    metric(borrower, {
      column: "city",
      label: "City",
      value: borrower.city,
      sub: "Business city",
      severity: "neutral",
      interpretation: `Based in ${borrower.city}. Geographic context informs regional economic exposure.`,
    }),
    metric(borrower, {
      column: "state",
      label: "State",
      value: borrower.state,
      sub: "Business state",
      severity: "neutral",
      interpretation: `Located in ${borrower.state}. Regional context can affect borrower risk.`,
    }),
    metric(borrower, {
      column: "latestannualrevenue",
      label: "Annual Revenue",
      value: borrower.revenueLabel,
      sub: "Latest reported revenue",
      severity: borrower.latestannualrevenue >= 500_000 ? "good" : borrower.latestannualrevenue >= 100_000 ? "neutral" : "bad",
      interpretation:
        borrower.latestannualrevenue >= 500_000
          ? "Strong revenue base. Indicates capacity to service debt."
          : borrower.latestannualrevenue >= 100_000
            ? "Modest revenue. Adequate for small loan exposure."
            : "Low revenue. Debt servicing capacity may be limited.",
    }),
  ];
}

export function getZoneSeverity(borrower: Borrower, zoneId: ZoneId): MetricSeverity {
  const availableMetrics = getZoneMetrics(borrower, zoneId).filter((m) => !m.isMissing);
  if (availableMetrics.length === 0) return "neutral";

  const badCount = availableMetrics.filter((m) => m.severity === "bad").length;
  const goodCount = availableMetrics.filter((m) => m.severity === "good").length;
  if (badCount >= 2) return "bad";
  if (goodCount >= 2) return "good";
  return "neutral";
}

function metric(borrower: Borrower, input: MetricInput): ZoneMetric {
  if (!hasColumnData(borrower, input.column)) {
    return {
      column: input.column,
      label: input.label,
      value: "NIL",
      sub: "No data in CSV",
      severity: "neutral",
      interpretation: `${input.label} is empty for this record in the imported CSV.`,
      isMissing: true,
    };
  }

  return {
    ...input,
    isMissing: false,
  };
}

function hasColumnData(borrower: Borrower, column: string) {
  if (borrower.csvValues && Object.prototype.hasOwnProperty.call(borrower.csvValues, column)) {
    return !isEmptyCell(borrower.csvValues[column]);
  }

  return !isEmptyCell((borrower as unknown as Record<string, CsvCellValue>)[column]);
}

function isEmptyCell(value: CsvCellValue) {
  return value === null || value === undefined || String(value).trim() === "";
}
