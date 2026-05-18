export type RiskLevel = "healthy" | "moderate" | "high";
export type DelinquencyLevel = "none" | "minor" | "moderate" | "severe";
export type MetricSeverity = "good" | "neutral" | "bad";
export type CsvCellValue = string | number | null | undefined;
export type CsvRowValues = Record<string, CsvCellValue>;

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
  csvColumns?: string[];
  csvValues?: CsvRowValues;
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
  column?: string;
  label: string;
  value: string;
  sub: string;
  severity: MetricSeverity;
  interpretation: string;
  isMissing?: boolean;
};
