import type { Borrower, RawBorrower } from "../types/borrower";

export function mapBorrower(raw: RawBorrower): Borrower {
  const healthIndex = raw.borrower_health_index || 0;
  const riskLevel = healthIndex >= 65 ? "healthy" : healthIndex >= 55 ? "moderate" : "high";
  const riskLabel = healthIndex >= 65 ? "Healthy" : healthIndex >= 55 ? "Moderate Risk" : "High Risk";
  const ficoLabel = getFicoLabel(raw.ficoscore);
  const revenueLabel = getRevenueLabel(raw.latestannualrevenue);
  const delinquent = raw.maxdpd > 30 ? "severe" : raw.maxdpd > 7 ? "moderate" : raw.maxdpd > 0 ? "minor" : "none";
  const industryClean = raw.industry
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    ...raw,
    riskLevel,
    riskLabel,
    ficoLabel,
    revenueLabel,
    delinquent,
    initials: raw.companybusinessname.trim().slice(0, 2).toUpperCase(),
    industryClean,
  };
}

function getFicoLabel(fico: number | null) {
  if (!fico) return "N/A";
  if (fico >= 750) return "Excellent";
  if (fico >= 700) return "Good";
  if (fico >= 650) return "Fair";
  return "Poor";
}

function getRevenueLabel(revenue: number) {
  if (revenue >= 1_000_000) return "$1M+";
  if (revenue >= 500_000) return "$500K-$1M";
  if (revenue >= 200_000) return "$200K-$500K";
  if (revenue >= 100_000) return "$100K-$200K";
  return "<$100K";
}
