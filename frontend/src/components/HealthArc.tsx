import { useEffect, useRef } from "react";
import { riskColors } from "../constants/risk";
import type { RiskLevel } from "../types/borrower";

type HealthArcProps = {
  cx: number;
  cy: number;
  r: number;
  value: number;
  riskLevel: RiskLevel;
  strokeWidth?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function HealthArc({ cx, cy, r, value, riskLevel, strokeWidth = 5 }: HealthArcProps) {
  const colors = riskColors[riskLevel];
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGPathElement>(null);

  const startAngle = -130;
  const endAngle = 130;
  const totalSweep = endAngle - startAngle;
  const filledSweep = (value / 100) * totalSweep;
  const filledEnd = startAngle + filledSweep;

  const trackPath = describeArc(cx, cy, r, startAngle, endAngle);
  const valuePath = describeArc(cx, cy, r, startAngle, filledEnd);

  useEffect(() => {
    const animate = (el: SVGPathElement | null) => {
      if (!el) return;
      const length = el.getTotalLength();
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
      void el.getBoundingClientRect();
      el.style.transition = "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s";
      el.style.strokeDashoffset = "0";
    };
    animate(pathRef.current);
    animate(glowRef.current);
  }, [value]);

  return (
    <g>
      {/* Track */}
      <path d={trackPath} fill="none" stroke={colors.ring}
        strokeWidth={strokeWidth} strokeLinecap="round" opacity="0.5" />
      {/* Glow duplicate (blurred) */}
      <path ref={glowRef} d={valuePath} fill="none"
        stroke={colors.arc} strokeWidth={strokeWidth + 4} strokeLinecap="round"
        opacity="0.25" style={{ filter: "blur(4px)" }} />
      {/* Main filled arc */}
      <path ref={pathRef} d={valuePath} fill="none"
        stroke={colors.arc} strokeWidth={strokeWidth} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 5px ${colors.arc}88)` }} />
    </g>
  );
}