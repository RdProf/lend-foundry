import type { MetricSeverity, RiskLevel } from "../types/borrower";

type ColorSet = {
  bg: string;
  text: string;
  border: string;
  dot: string;
  arc: string;
  ring: string;
};

export const riskColors: Record<RiskLevel, ColorSet> = {
  healthy: {
    bg: "#FFFFFF",
    text: "#15803D",
    border: "#22C55E",
    dot: "#16A34A",
    arc: "#22C55E",
    ring: "#DCFCE7",
  },
  moderate: {
    bg: "#FFFFFF",
    text: "#92400E",
    border: "#F59E0B",
    dot: "#D97706",
    arc: "#FBBF24",
    ring: "#FEF3C7",
  },
  high: {
    bg: "#FFFFFF",
    text: "#991B1B",
    border: "#EF4444",
    dot: "#DC2626",
    arc: "#EF4444",
    ring: "#FEE2E2",
  },
};

export const severityStyle: Record<MetricSeverity, Pick<ColorSet, "bg" | "text" | "border">> = {
  good: { text: "#15803D", bg: "#FFFFFF", border: "#22C55E" },
  neutral: { text: "#475569", bg: "#FFFFFF", border: "#CBD5E1" },
  bad: { text: "#B91C1C", bg: "#FFFFFF", border: "#EF4444" },
};
