import { useState, useRef, useCallback, useEffect, useId, type CSSProperties } from "react";
import { zones, type ZoneId } from "../constants/zones";
import { riskColors } from "../constants/risk";
import { getZoneMetrics, getZoneSeverity } from "../utils/zoneMetrics";
import { HealthArc } from "./HealthArc";
import type { Borrower, ZoneMetric } from "../types/borrower";

type RadialGraphProps = {
  borrower: Borrower;
  canvasWidth: number;
  canvasHeight: number;
  onMetricClick: (metric: ZoneMetric, svgX: number, svgY: number) => void;
  /** When true, reduces visual noise: no orbit rings, no glow, no pulse, no hint text */
  compact?: boolean;
  /** Optional external zone focus — when provided, overrides internal selectedZone */
  activeZoneFilter?: ZoneId | null;
  /** Callback when a zone is focused/unfocused externally */
  onZoneFocus?: (zone: ZoneId | null) => void;
  /** Optional callback for background click (e.g. to close external insight panels) */
  onBackgroundClick?: () => void;
};

const DOMAIN_RADIUS = 180;
const METRIC_RADIUS = 315;
const CENTER_R = 68;
const ZONE_R_BASE = 52;
const METRIC_R = 22;
const HEALTH_ARC_R = 82;

const PADDING = 30;
const MISSING_COLOR = "#94A3B8";

function radians(deg: number) {
  return (deg * Math.PI) / 180;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = radians(angleDeg);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function curveControlPoint(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return { mx, my };
}

export function RadialGraph({ borrower, canvasWidth, canvasHeight, onMetricClick, compact = false, activeZoneFilter, onZoneFocus, onBackgroundClick }: RadialGraphProps) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  const [internalSelectedZone, setInternalSelectedZone] = useState<ZoneId | null>(null);
  // If external activeZoneFilter prop is provided, it takes precedence
  const selectedZone = activeZoneFilter !== undefined ? activeZoneFilter : internalSelectedZone;
  const [hoveredZone, setHoveredZone] = useState<ZoneId | null>(null);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [animStep, setAnimStep] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = `rg${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStep(1), 80);
    const t2 = setTimeout(() => setAnimStep(2), 280);
    const t3 = setTimeout(() => { setAnimStep(3); setMounted(true); }, 520);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const riskColor = riskColors[borrower.riskLevel];

  const handleZoneClick = useCallback((zoneId: ZoneId) => {
    const next = selectedZone === zoneId ? null : zoneId;
    if (onZoneFocus) {
      onZoneFocus(next);
    } else {
      setInternalSelectedZone(next);
    }
  }, [selectedZone, onZoneFocus]);

  const handleMetricClick = useCallback(
    (e: React.MouseEvent, metric: ZoneMetric, px: number, py: number) => {
      e.stopPropagation();
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const vWidth = canvasWidth + PADDING * 2;
      const vHeight = canvasHeight + PADDING * 2;
      const htmlX = (px + PADDING) * (rect.width / vWidth);
      const htmlY = (py + PADDING) * (rect.height / vHeight);
      onMetricClick(metric, htmlX, htmlY);
    },
    [canvasWidth, canvasHeight, onMetricClick]
  );

  const handleBgClick = useCallback(() => {
    if (onZoneFocus) onZoneFocus(null);
    else setInternalSelectedZone(null);
    if (onBackgroundClick) onBackgroundClick();
  }, [onZoneFocus, onBackgroundClick]);
  const healthMetric = getZoneMetrics(borrower, "health").find((metric) => metric.column === "borrower_health_index");
  const healthValue = healthMetric?.isMissing ? "NIL" : `${borrower.borrower_health_index}`;

  return (
    <svg
      ref={svgRef}
      viewBox={`${-PADDING} ${-PADDING} ${canvasWidth + PADDING * 2} ${canvasHeight + PADDING * 2}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full"
      onClick={handleBgClick}
      aria-label="Borrower intelligence graph"
    >
      <defs>
        <style>{`
          @keyframes ${uid}orbit { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes ${uid}orbitRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
          @keyframes ${uid}centerBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.022)} }
          @keyframes ${uid}badPulse { 0%,100%{opacity:0.18} 50%{opacity:0.5} }
          @keyframes ${uid}nodePop { 0%{opacity:0} 100%{opacity:1} }
          @keyframes ${uid}slideIn { 0%{opacity:0;transform:scale(0.9) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
          @keyframes ${uid}edgeDraw { from{stroke-dashoffset:500;opacity:0} to{stroke-dashoffset:0;opacity:1} }
          @keyframes ${uid}edgePulse { 0%,100%{stroke-width:2.5; opacity:0.8} 50%{stroke-width:3.5; opacity:1} }
          @keyframes ${uid}hintFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
          @keyframes ${uid}selectedPulse { 0%, 100%{transform:scale(1);opacity:0.75} 50%{transform:scale(1.12);opacity:1} }
        `}</style>

        <radialGradient id={`${uid}cg`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EEF2FF" />
        </radialGradient>
        <filter id={`${uid}ns`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="rgba(15,23,42,0.14)" />
        </filter>
        <filter id={`${uid}cs`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="6" stdDeviation="18" floodColor="rgba(15,23,42,0.18)" />
        </filter>
        <filter id={`${uid}ms`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="rgba(15,23,42,0.13)" />
        </filter>
        <pattern id={`${uid}dp`} x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.9" fill="rgba(148,163,184,0.22)" />
        </pattern>
        {zones.map((z) => {
          const zoneColor = getZoneMetrics(borrower, z.id).every((metric) => metric.isMissing) ? MISSING_COLOR : z.color;

          return (
            <linearGradient key={z.id} id={`${uid}eg${z.id}`} gradientUnits="userSpaceOnUse"
              x1={cx} y1={cy}
              x2={polarToXY(cx, cy, DOMAIN_RADIUS, z.angle).x}
              y2={polarToXY(cx, cy, DOMAIN_RADIUS, z.angle).y}
            >
              <stop offset="0%" stopColor={zoneColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={zoneColor} stopOpacity="1" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Background */}
      <rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="transparent" />
      <rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="transparent" />

      {/* Animated orbit rings — hidden in compact mode */}
      {!compact && (
        <>
          <g style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `${uid}orbit 65s linear infinite`,
            transition: "opacity 0.5s ease",
            opacity: selectedZone ? 0 : 1
          }}>
            <circle cx={cx} cy={cy} r={DOMAIN_RADIUS + ZONE_R_BASE + 16} fill="none"
              stroke="rgba(148,163,184,0.09)" strokeWidth="1" strokeDasharray="4 12" />
          </g>
          <g style={{
            transformOrigin: `${cx}px ${cy}px`,
            animation: `${uid}orbitRev 95s linear infinite`,
            transition: "opacity 0.5s ease",
            opacity: selectedZone ? 0 : 1
          }}>
            <circle cx={cx} cy={cy} r={METRIC_RADIUS + METRIC_R + 14} fill="none"
              stroke="rgba(148,163,184,0.06)" strokeWidth="1" strokeDasharray="2 16" />
          </g>
        </>
      )}

      {/* ── EDGES: Center to Zone ── */}
      {zones.map((zone, zi) => {
        const zoneMetrics = getZoneMetrics(borrower, zone.id);
        const zoneColor = zoneMetrics.every((metric) => metric.isMissing) ? MISSING_COLOR : zone.color;
        const zonePos = polarToXY(cx, cy, DOMAIN_RADIUS, zone.angle);
        const isSelected = selectedZone === zone.id;
        const isHovered = hoveredZone === zone.id;
        const isActive = isSelected || isHovered;
        const isAnySelected = selectedZone !== null;
        const { mx, my } = curveControlPoint(cx, cy, zonePos.x, zonePos.y);
        const pullX = mx + (zonePos.x - cx) * 0.15;
        const pullY = my + (zonePos.y - cy) * 0.15;
        const pLen = DOMAIN_RADIUS * 1.08;

        return (
          <g key={`e${zone.id}`}>
            {/* Glow layer — hidden in compact mode */}
            {!compact && isActive && !isAnySelected && (
              <path
                d={`M ${cx} ${cy} Q ${pullX} ${pullY} ${zonePos.x} ${zonePos.y}`}
                fill="none" stroke={zoneColor} strokeWidth="10" strokeLinecap="round"
                opacity="0.12" style={{ filter: "blur(4px)" }}
              />
            )}
            <path
              d={`M ${cx} ${cy} Q ${pullX} ${pullY} ${zonePos.x} ${zonePos.y}`}
              fill="none"
              stroke={isActive ? zoneColor : `url(#${uid}eg${zone.id})`}
              strokeWidth={isHovered ? 2.5 : 2}
              strokeDasharray={isActive ? "none" : `${pLen} ${pLen}`}
              strokeLinecap="round"
              opacity={isAnySelected ? 0 : isActive ? 1 : animStep >= 1 ? 0.65 : 0}
              style={{
                filter: "none",
                transition: "stroke-width 0.4s ease, opacity 0.4s ease, filter 0.4s ease",
                animation: (animStep >= 1 && !isAnySelected)
                  ? `${uid}edgeDraw 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${zi * 0.09}s both`
                  : (isActive && !compact ? `${uid}edgePulse 2.5s ease-in-out infinite` : "none"),
              }}
            />
          </g>
        );
      })}

      {/* ── METRIC EDGES ── */}
      {zones.map((zone) => {
        if (selectedZone !== zone.id) return null;
        const metrics = getZoneMetrics(borrower, zone.id);
        const SPAWN_RADIUS = 200;
        return metrics.map((metric, i) => {
          const metricAngle = -90 + (i * (360 / metrics.length));
          const metricPos = polarToXY(cx, cy, SPAWN_RADIUS, metricAngle);
          return (
            <line key={`em${zone.id}${i}`}
              x1={cx} y1={cy} x2={metricPos.x} y2={metricPos.y}
              stroke={metric.isMissing ? MISSING_COLOR : zone.color}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity={metric.isMissing ? "0.28" : "0.4"}
              style={{ animation: `${uid}slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s both` }}
            />
          );
        });
      })}

      {/* ── METRIC NODES ── */}
      {zones.map((zone) => {
        if (selectedZone !== zone.id) return null;
        const metrics = getZoneMetrics(borrower, zone.id);
        const SPAWN_RADIUS = 230;
        return metrics.map((metric, i) => {
          const metricAngle = -90 + (i * (360 / metrics.length));
          const pos = polarToXY(cx, cy, SPAWN_RADIUS, metricAngle);
          const isHov = hoveredMetric === `${zone.id}-${i}`;
          const metricColor = metric.isMissing ? MISSING_COLOR : zone.color;

          const severityColor =
            metric.isMissing ? MISSING_COLOR :
              metric.severity === "good" ? "#16A34A" :
                metric.severity === "bad" ? "#DC2626" : "#64748B";

          const CARD_W = 150;
          const CARD_H = 86;
          const cx_ = pos.x - CARD_W / 2;
          const cy_ = pos.y - CARD_H / 2;

          return (
            <g key={`m${zone.id}${i}`}
              style={{
                animation: `${uid}slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.12 + i * 0.09}s both`,
                transformOrigin: `${pos.x}px ${pos.y}px`,
              }}
            >
              <g
                style={{
                  cursor: "pointer",
                  transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: `scale(${isHov ? 1.04 : 1})`,
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                }}
                onClick={(e) => handleMetricClick(e, metric, pos.x, pos.y)}
                onMouseEnter={() => setHoveredMetric(`${zone.id}-${i}`)}
                onMouseLeave={() => setHoveredMetric(null)}
              >
                {/* Hover glow */}
                {isHov && (
                  <rect x={cx_ - 6} y={cy_ - 6} width={CARD_W + 12} height={CARD_H + 12}
                    rx={16} fill={metricColor} opacity="0.10" />
                )}

                {/* Solid base to hide overlapping lines */}
                <rect x={cx_} y={cy_} width={CARD_W} height={CARD_H}
                  rx={12} fill={metric.isMissing ? "#F8FAFC" : "#FFFFFF"} filter={`url(#${uid}ms)`} />

                {/* Card background — zone-tinted */}
                <rect x={cx_} y={cy_} width={CARD_W} height={CARD_H}
                  rx={12}
                  fill={metric.isMissing ? "#F8FAFC" : `${zone.color}10`}
                  stroke={isHov ? metricColor : metric.isMissing ? "#CBD5E1" : `${zone.color}40`}
                  strokeWidth={isHov ? 2 : 1.5}
                />

                {/* Top accent bar — zone color full */}
                <rect x={cx_} y={cy_} width={CARD_W} height={5} rx={3} fill={metricColor} />
                <rect x={cx_} y={cy_ + 3} width={CARD_W} height={2} fill={metricColor} />

                {/* Severity dot */}
                <circle cx={pos.x + CARD_W / 2 - 12} cy={cy_ + 14} r={4}
                  fill={severityColor} opacity="0.9" />

                {/* Metric label */}
                <text x={pos.x} y={cy_ + 26}
                  textAnchor="middle" fontSize="8.5" fontWeight="700"
                  fontFamily="Inter, sans-serif"
                  fill={metricColor} letterSpacing="0.3"
                  style={{ pointerEvents: "none" }}>
                  {metric.label.toUpperCase()}
                </text>

                {/* Hairline divider */}
                <line
                  x1={cx_ + 12} y1={cy_ + 34}
                  x2={cx_ + CARD_W - 12} y2={cy_ + 34}
                  stroke={metricColor} strokeWidth="0.75" opacity="0.3"
                />

                {/* Value */}
                <text x={pos.x} y={cy_ + 54}
                  textAnchor="middle" fontSize="14" fontWeight="800"
                  fontFamily="Inter, sans-serif" fill={metric.isMissing ? "#64748B" : "#0F172A"} letterSpacing="-0.4"
                  style={{ pointerEvents: "none" }}>
                  {metric.value}
                </text>

                {/* Sub label */}
                <text x={pos.x} y={cy_ + 70}
                  textAnchor="middle" fontSize="9" fontWeight="500"
                  fontFamily="Inter, sans-serif" fill={metricColor} opacity={0.65}
                  style={{ pointerEvents: "none" }}>
                  {metric.sub}
                </text>
              </g>
            </g>
          );
        });
      })}

      {/* ── ZONE NODES ── */}
      {zones.map((zone, zi) => {
        const zoneMetrics = getZoneMetrics(borrower, zone.id);
        const isZoneMissing = zoneMetrics.every((metric) => metric.isMissing);
        const zoneColor = isZoneMissing ? MISSING_COLOR : zone.color;
        const isSelected = selectedZone === zone.id;
        const isHovered = hoveredZone === zone.id;
        const isAnySelected = selectedZone !== null;

        const targetPos = isSelected
          ? { x: cx, y: cy }
          : polarToXY(cx, cy, DOMAIN_RADIUS, zone.angle);

        const dx = targetPos.x - cx;
        const dy = targetPos.y - cy;
        const opacity = isAnySelected && !isSelected ? 0 : 1;
        const pointerEvents: CSSProperties["pointerEvents"] = isAnySelected && !isSelected ? "none" : "auto";

        const zoneSeverity = getZoneSeverity(borrower, zone.id);
        const severityBonus = !isZoneMissing && zoneSeverity === "bad" ? 6 : !isZoneMissing && zoneSeverity === "good" ? 2 : 0;
        const r = ZONE_R_BASE + severityBonus + (isHovered && !isSelected ? 4 : 0);

        return (
          <g key={`z${zone.id}`}
            style={{
              cursor: "pointer",
              transition: "transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease, filter 0.4s ease",
              transform: `translate(${dx}px, ${dy}px) scale(${isSelected ? 1.65 : 1})`,
              transformOrigin: `${cx}px ${cy}px`,
              opacity: opacity,
              filter: "none",
              pointerEvents,
              animation: (animStep >= 2 && !isAnySelected)
                ? `${uid}nodePop 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 + zi * 0.07}s both`
                : "none",
            }}
            onClick={(e) => { e.stopPropagation(); handleZoneClick(zone.id); }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
          >
            {/* Bad zone pulsing ring — hidden in compact mode */}
            {!compact && zoneSeverity === "bad" && !isZoneMissing && !isSelected && (
              <circle cx={cx} cy={cy} r={r + 13} fill="none"
                stroke="#EF4444" strokeWidth="1.5"
                style={{ animation: `${uid}badPulse 2.2s ease-in-out infinite` }} />
            )}
            {/* Selected halo */}
            {isSelected && (
              <circle cx={cx} cy={cy} r={r + 20} fill={`${zoneColor}14`}
                stroke={`${zoneColor}30`} strokeWidth="1.5"
                style={{
                  transformOrigin: `${cx}px ${cy}px`,
                  animation: `${uid}selectedPulse 2.5s ease-in-out infinite`
                }} />
            )}
            {/* Hover glow */}
            {isHovered && !isSelected && (
              <circle cx={cx} cy={cy} r={r + 10} fill={`${zoneColor}10`}
                stroke={`${zoneColor}22`} strokeWidth="1" />
            )}
            {/* Main circle */}
            <circle cx={cx} cy={cy} r={r}
              fill={isSelected ? zoneColor : "#FFFFFF"}
              stroke={zoneColor}
              strokeWidth={isSelected ? 0 : !isZoneMissing && zoneSeverity === "bad" ? 2.5 : 2}
              filter={`url(#${uid}ns)`}
              style={{ transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)" }} />
            {/* Icon */}
            <text x={cx} y={cy - 11} textAnchor="middle"
              fontSize="18" fontWeight="700" fontFamily="Inter, sans-serif"
              fill={isSelected ? "#FFFFFF" : zoneColor}
              style={{ pointerEvents: "none", transition: "fill 0.3s ease" }}>
              {zone.icon}
            </text>
            {/* Label line 1 */}
            <text x={cx} y={cy + 6} textAnchor="middle"
              fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif"
              fill={isSelected ? "rgba(255,255,255,0.95)" : isZoneMissing ? "#64748B" : "#1E293B"} letterSpacing="0.4"
              style={{ pointerEvents: "none" }}>
              {zone.label.split(" ")[0].toUpperCase()}
            </text>
            {/* Label line 2 */}
            <text x={cx} y={cy + 18} textAnchor="middle"
              fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif"
              fill={isSelected ? "rgba(255,255,255,0.6)" : "#64748B"} letterSpacing="0.2"
              style={{ pointerEvents: "none" }}>
              {zone.label.split(" ").slice(1).join(" ").toUpperCase()}
            </text>
            {/* Severity badge */}
            {zoneSeverity === "bad" && !isZoneMissing && !isSelected && (
              <g>
                <circle cx={cx + r - 4} cy={cy - r + 4} r={7} fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x={cx + r - 4} y={cy - r + 8.5} textAnchor="middle"
                  fontSize="9" fontWeight="800" fill="white" style={{ pointerEvents: "none" }}>!</text>
              </g>
            )}
          </g>
        );
      })}

      {/* ── CENTER NODE ── */}
      <g style={{
        transformOrigin: `${cx}px ${cy}px`,
        animation: `${uid}centerBreathe 4s ease-in-out infinite`,
        transition: "opacity 0.4s ease",
        opacity: selectedZone ? 0 : 1,
        pointerEvents: selectedZone ? "none" : "auto"
      }}>
        {mounted && (
          <HealthArc cx={cx} cy={cy} r={HEALTH_ARC_R}
            value={healthMetric?.isMissing ? 0 : borrower.borrower_health_index}
            riskLevel={healthMetric?.isMissing ? "moderate" : borrower.riskLevel}
            strokeWidth={6} />
        )}
        <circle cx={cx} cy={cy} r={CENTER_R + 8} fill="none"
          stroke={healthMetric?.isMissing ? "#CBD5E1" : riskColor.ring} strokeWidth="1.5" opacity="0.55" />
        <circle cx={cx} cy={cy} r={CENTER_R}
          fill={`url(#${uid}cg)`} stroke={healthMetric?.isMissing ? "#CBD5E1" : riskColor.border} strokeWidth="2.5"
          filter={`url(#${uid}cs)`} />
        {/* Initials */}
        <text x={cx} y={cy - 16} textAnchor="middle"
          fontSize="24" fontWeight="800" fontFamily="Inter, sans-serif"
          fill="#0F172A" letterSpacing="-1">{borrower.initials}</text>
        {/* Label */}
        <text x={cx} y={cy - 2} textAnchor="middle"
          fontSize="8.5" fontWeight="600" fontFamily="Inter, sans-serif"
          fill="#94A3B8" letterSpacing="1">HEALTH INDEX</text>
        {/* Value */}
        <text x={cx} y={cy + 22} textAnchor="middle"
          fontSize="26" fontWeight="800" fontFamily="Inter, sans-serif"
          fill={healthMetric?.isMissing ? MISSING_COLOR : riskColor.dot} letterSpacing="-1">{healthValue}</text>
        {/* Badge */}
        <rect x={cx - 36} y={cy + 28} width={72} height={20} rx={10} fill={healthMetric?.isMissing ? "#F1F5F9" : riskColor.bg} />
        <text x={cx} y={cy + 42} textAnchor="middle"
          fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif"
          fill={healthMetric?.isMissing ? "#64748B" : riskColor.text} letterSpacing="0.5">
          {healthMetric?.isMissing ? "NO DATA" : borrower.riskLabel.toUpperCase()}
        </text>
      </g>

      {/* ── Hint text — hidden in compact mode ── */}
      {!compact && !selectedZone && mounted && (
        <g style={{ animation: `${uid}hintFade 0.5s ease 1.2s both` }}>
          <rect x={cx - 148} y={canvasHeight - 44} width={296} height={27} rx={13.5}
            fill="rgba(15,23,42,0.045)" />
          <text x={cx} y={canvasHeight - 26} textAnchor="middle"
            fontSize="12" fontWeight="600" fontFamily="Inter, sans-serif"
            fill="#94A3B8" letterSpacing="0.1" style={{ pointerEvents: "none" }}>
            ↗ Click a domain node to explore metrics
          </text>
        </g>
      )}
    </svg>
  );
}
