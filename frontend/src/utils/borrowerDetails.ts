import type { Borrower, CsvCellValue } from "../types/borrower";
import { graphMetricColumnSet } from "./zoneMetrics";

const fallbackBorrowerColumns = [
  "borrowerid",
  "companybusinessname",
  "city",
  "state",
  "email",
  "phone",
  "industry",
  "ficoscore",
  "timeinbusiness",
  "latestannualrevenue",
  "latestannualsales",
  "total_loan_amount",
  "active_loans",
  "averageinterestrate",
  "avgtenure",
  "lastfundedsince",
  "maxdpd",
  "avgdpd",
  "dpd_bucket",
  "repayment_score",
  "stability_score",
  "exposure_score",
  "business_size_score",
  "borrower_health_index",
  "probability_of_default",
  "deliquency_probability",
];

const columnLabelOverrides: Record<string, string> = {
  companybusinessname: "Business Name",
  borrowerid: "Borrower ID",
  averageinterestrate: "Avg Interest Rate",
  avgtenure: "Avg Tenure",
  lastfundedsince: "Last Funded Since",
  dpd_bucket: "DPD Bucket",
  deliquency_probability: "Delinquency Probability",
  probability_of_default: "Probability of Default",
  latestannualsales: "Annual Sales",
};

const derivedBorrowerKeys = new Set([
  "riskLevel",
  "riskLabel",
  "ficoLabel",
  "revenueLabel",
  "delinquent",
  "initials",
  "industryClean",
  "csvColumns",
  "csvValues",
]);

export type BorrowerDetailField = {
  column: string;
  label: string;
  value: string;
  isEmpty: boolean;
};

export function getBorrowerDetailFields(borrower: Borrower): BorrowerDetailField[] {
  const columns = getBorrowerColumns(borrower);

  return columns.map((column) => {
    const value = getBorrowerColumnValue(borrower, column);
    const isEmpty = isEmptyCell(value);

    return {
      column,
      label: formatColumnLabel(column),
      value: isEmpty ? "No data" : String(value),
      isEmpty,
    };
  });
}

export function getUnmappedBorrowerDetailFields(borrower: Borrower): BorrowerDetailField[] {
  return getBorrowerDetailFields(borrower).filter((field) => !graphMetricColumnSet.has(field.column));
}

function getBorrowerColumns(borrower: Borrower) {
  if (borrower.csvColumns?.length) {
    return borrower.csvColumns;
  }

  const rawKeys = Object.keys(borrower).filter((key) => !derivedBorrowerKeys.has(key));
  return rawKeys.length ? rawKeys : fallbackBorrowerColumns;
}

function getBorrowerColumnValue(borrower: Borrower, column: string): CsvCellValue {
  if (borrower.csvValues && Object.prototype.hasOwnProperty.call(borrower.csvValues, column)) {
    return borrower.csvValues[column];
  }

  return (borrower as unknown as Record<string, CsvCellValue>)[column];
}

function isEmptyCell(value: CsvCellValue) {
  return value === null || value === undefined || String(value).trim() === "";
}

function formatColumnLabel(column: string) {
  if (columnLabelOverrides[column]) return columnLabelOverrides[column];

  return column
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
