export const zones = [
  {
    id: "credit",
    label: "Credit Risk",
    // Slightly north-west — most visually dominant zone
    angle: -100,
    color: "#DC2626",
    accentColor: "#FEE2E2",
    icon: "◈",
    description: "Credit quality and delinquency signals",
  },
  {
    id: "health",
    label: "Business Health",
    // North-east, balanced counterpart to credit
    angle: -35,
    color: "#16A34A",
    accentColor: "#DCFCE7",
    icon: "◉",
    description: "Operational stability and longevity",
  },
  {
    id: "exposure",
    label: "Loan Exposure",
    // South-east
    angle: 55,
    color: "#2563EB",
    accentColor: "#DBEAFE",
    icon: "◐",
    description: "Outstanding loan volume and portfolio risk",
  },
  {
    id: "behavior",
    label: "Repayment",
    // South-west
    angle: 145,
    color: "#D97706",
    accentColor: "#FEF3C7",
    icon: "◑",
    description: "Payment consistency and behavioral patterns",
  },
  {
    id: "identity",
    label: "Business Profile",
    // West, slightly lower
    angle: 215,
    color: "#7C3AED",
    accentColor: "#EDE9FE",
    icon: "◎",
    description: "Industry, location and business identity",
  },
] as const;

export type ZoneId = (typeof zones)[number]["id"];
