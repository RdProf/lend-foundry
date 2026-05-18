export const zones = [
  {
    id: "credit",
    label: "Credit Risk",
    // Slightly north-west — most visually dominant zone
    angle: -100,
    color: "#2563EB", // Blue
    accentColor: "#DBEAFE",
    icon: "◈",
    description: "Credit quality and delinquency signals",
  },
  {
    id: "health",
    label: "Business Health",
    // North-east, balanced counterpart to credit
    angle: -35,
    color: "#7C3AED", // Violet
    accentColor: "#EDE9FE",
    icon: "◉",
    description: "Operational stability and longevity",
  },
  {
    id: "exposure",
    label: "Loan Exposure",
    // South-east
    angle: 55,
    color: "#DB2777", // Pink
    accentColor: "#FCE7F3",
    icon: "◐",
    description: "Outstanding loan volume and portfolio risk",
  },
  {
    id: "behavior",
    label: "Repayment",
    // South-west
    angle: 145,
    color: "#0D9488", // Teal
    accentColor: "#CCFBF1",
    icon: "◑",
    description: "Payment consistency and behavioral patterns",
  },
  {
    id: "identity",
    label: "Business Profile",
    // West, slightly lower
    angle: 215,
    color: "#475569", // Slate
    accentColor: "#F1F5F9",
    icon: "◎",
    description: "Industry, location and business identity",
  },
] as const;

export type ZoneId = (typeof zones)[number]["id"];
