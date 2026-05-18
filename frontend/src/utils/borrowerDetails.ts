import type { Borrower, CsvCellValue } from "../types/borrower";
import { graphMetricColumnSet } from "./zoneMetrics";

const fallbackBorrowerColumns = [
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
];

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
  return column
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
