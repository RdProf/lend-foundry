import Papa from "papaparse";
import { mapBorrower } from "./borrowerMapper";
import type { RawBorrower, Borrower } from "../types/borrower";

export function parseCSV(csvText: string): Promise<Borrower[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (
          results.data.length > 0 &&
          !results.data[0].borrowerid &&
          !results.data[0].companybusinessname
        ) {
          reject(new Error("Invalid CSV format. Missing required 'borrowerid' or 'companybusinessname' columns."));
          return;
        }
        try {
          const parsedData = results.data.map((row) => {
            const raw: RawBorrower = {
              borrowerid: row.borrowerid || "",
              companybusinessname: row.companybusinessname || "",
              city: row.city || "",
              state: row.state || "",
              industry: row.industry || "",
              ficoscore: row.ficoscore ? Number(row.ficoscore) : null,
              timeinbusiness: Number(row.timeinbusiness) || 0,
              latestannualrevenue: Number(row.latestannualrevenue) || 0,
              total_loan_amount: Number(row.total_loan_amount) || 0,
              active_loans: Number(row.active_loans) || 0,
              maxdpd: Number(row.maxdpd) || 0,
              avgdpd: Number(row.avgdpd) || 0,
              repayment_score: Number(row.repayment_score) || 0,
              stability_score: Number(row.stability_score) || 0,
              exposure_score: Number(row.exposure_score) || 0,
              business_size_score: Number(row.business_size_score) || 0,
              borrower_health_index: Number(row.borrower_health_index) || 0,
              email: row.email || null,
              phone: row.phone || null,
              latestannualsales: row.latestannualsales
                ? Number(row.latestannualsales)
                : null,
              probability_of_default: row.probability_of_default
                ? Number(row.probability_of_default)
                : null,
              averageinterestrate: row.averageinterestrate
                ? Number(row.averageinterestrate)
                : null,
              avgtenure: row.avgtenure ? Number(row.avgtenure) : null,
              lastfundedsince: row.lastfundedsince || null,
              dpd_bucket: row.dpd_bucket || null,
              deliquency_probability: row.deliquency_probability
                ? Number(row.deliquency_probability)
                : null,
            };
            return mapBorrower(raw);
          });
          resolve(parsedData);
        } catch (err) {
          reject(err);
        }
      },
      error: (error: any) => reject(error),
    });
  });
}
