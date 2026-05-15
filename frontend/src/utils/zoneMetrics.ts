import type { Borrower, ZoneMetric } from "../types/borrower";
import type { ZoneId } from "../constants/zones";
import type { MetricSeverity } from "../types/borrower";

export function getZoneMetrics(borrower: Borrower, zoneId: ZoneId): ZoneMetric[] {
  if (zoneId === "credit") {
    return [
      {
        label: "FICO Score",
        value: borrower.ficoscore ? `${borrower.ficoscore}` : "N/A",
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
      },
      {
        label: "Max DPD",
        value: `${borrower.maxdpd} days`,
        sub: borrower.delinquent === "none" ? "No delinquency" : `${borrower.delinquent} delinquency`,
        severity: borrower.maxdpd === 0 ? "good" : borrower.maxdpd <= 7 ? "neutral" : "bad",
        interpretation:
          borrower.maxdpd === 0
            ? "No missed payments. Strong payment discipline."
            : borrower.maxdpd <= 7
            ? "Minor delay. Likely situational, not systemic."
            : borrower.maxdpd <= 30
            ? "Moderate delinquency. Warrants closer monitoring."
            : "Severe delinquency. High collection risk.",
      },
      {
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
      },
    ];
  }

  if (zoneId === "health") {
    return [
      {
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
      },
      {
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
      },
      {
        label: "Years in Business",
        value: `${Math.round(borrower.timeinbusiness / 12)} yrs`,
        sub: `${borrower.timeinbusiness} months`,
        severity: borrower.timeinbusiness >= 120 ? "good" : borrower.timeinbusiness >= 60 ? "neutral" : "bad",
        interpretation:
          borrower.timeinbusiness >= 120
            ? "10+ years operating. Proven business resilience."
            : borrower.timeinbusiness >= 60
            ? "5–10 years. Established but still maturing."
            : "Under 5 years. Higher early-stage risk.",
      },
    ];
  }

  if (zoneId === "exposure") {
    return [
      {
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
      },
      {
        label: "Active Loans",
        value: `${borrower.active_loans}`,
        sub: borrower.active_loans === 0 ? "Fully repaid" : "Currently outstanding",
        severity: borrower.active_loans === 0 ? "good" : "neutral",
        interpretation:
          borrower.active_loans === 0
            ? "No outstanding balances. Clean repayment record."
            : `${borrower.active_loans} loan(s) currently active. Monitor repayment cadence.`,
      },
      {
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
      },
    ];
  }

  if (zoneId === "behavior") {
    return [
      {
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
      },
      {
        label: "Avg Interest Rate",
        value: `${borrower.avgannualinterestrate.toFixed(1)}%`,
        sub: "Average annual rate",
        severity: borrower.avgannualinterestrate <= 30 ? "good" : borrower.avgannualinterestrate <= 60 ? "neutral" : "bad",
        interpretation:
          borrower.avgannualinterestrate <= 30
            ? "Low rate — indicates strong creditworthiness history."
            : borrower.avgannualinterestrate <= 60
            ? "Mid-range rate. Typical for SMB lending."
            : "High interest rate. Suggests prior risk-adjusted pricing.",
      },
      {
        label: "Delinquency",
        value: borrower.delinquent === "none" ? "None" : borrower.delinquent.charAt(0).toUpperCase() + borrower.delinquent.slice(1),
        sub: "Payment behavior signal",
        severity: borrower.delinquent === "none" ? "good" : borrower.delinquent === "minor" ? "neutral" : "bad",
        interpretation:
          borrower.delinquent === "none"
            ? "No delinquency events detected."
            : borrower.delinquent === "minor"
            ? "Minor delinquency. Monitor but not alarming."
            : borrower.delinquent === "moderate"
            ? "Moderate delinquency. Escalate review process."
            : "Severe delinquency. High-priority risk flag.",
      },
    ];
  }

  // identity zone
  return [
    {
      label: "Industry",
      value: borrower.industryClean,
      sub: borrower.borrowerid,
      severity: "neutral",
      interpretation: `Operating in ${borrower.industryClean}. Industry context affects risk modeling and sector-specific volatility.`,
    },
    {
      label: "Location",
      value: `${borrower.city}, ${borrower.state}`,
      sub: "Business city and state",
      severity: "neutral",
      interpretation: `Based in ${borrower.city}, ${borrower.state}. Geographic context informs regional economic exposure.`,
    },
    {
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
    },
  ];
}

export function getZoneSeverity(borrower: Borrower, zoneId: ZoneId): MetricSeverity {
  const metrics = getZoneMetrics(borrower, zoneId);
  const badCount = metrics.filter((m) => m.severity === "bad").length;
  const goodCount = metrics.filter((m) => m.severity === "good").length;
  if (badCount >= 2) return "bad";
  if (goodCount >= 2) return "good";
  return "neutral";
}
