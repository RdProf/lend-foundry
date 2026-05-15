export type RiskLevel = "healthy" | "moderate" | "high";
export type DelinquencyLevel = "none" | "minor" | "moderate" | "severe";
export type MetricSeverity = "good" | "neutral" | "bad";

export type RawBorrower = {
  borrowerid: string;
  companybusinessname: string;
  city: string;
  state: string;
  industry: string;
  ficoscore: number | null;
  timeinbusiness: number;
  latestannualrevenue: number;
  total_loan_amount: number;
  active_loans: number;
  maxdpd: number;
  avgdpd: number;
  repayment_score: number;
  stability_score: number;
  exposure_score: number;
  business_size_score: number;
  borrower_health_index: number;
  avgannualinterestrate: number;
};

export type Borrower = RawBorrower & {
  riskLevel: RiskLevel;
  riskLabel: string;
  ficoLabel: string;
  revenueLabel: string;
  delinquent: DelinquencyLevel;
  initials: string;
  industryClean: string;
};

export type ZoneMetric = {
  label: string;
  value: string;
  sub: string;
  severity: MetricSeverity;
  interpretation: string;
};
