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
    bg: "#DCFCE7",
    text: "#15803D",
    border: "#86EFAC",
    dot: "#16A34A",
    arc: "#22C55E",
    ring: "#BBF7D0",
  },
  moderate: {
    bg: "#FEF9C3",
    text: "#92400E",
    border: "#FDE68A",
    dot: "#D97706",
    arc: "#FBBF24",
    ring: "#FDE68A",
  },
  high: {
    bg: "#FEE2E2",
    text: "#991B1B",
    border: "#FCA5A5",
    dot: "#DC2626",
    arc: "#EF4444",
    ring: "#FECACA",
  },
};

export const severityStyle: Record<MetricSeverity, Pick<ColorSet, "bg" | "text">> = {
  good: { text: "#15803D", bg: "#DCFCE7" },
  neutral: { text: "#4B5563", bg: "#F3F4F6" },
  bad: { text: "#991B1B", bg: "#FEE2E2" },
};
