import {
    useState,
    useRef,
    useCallback,
    useEffect,
    useId,
    useMemo,
} from "react";
import { zones, type ZoneId } from "../constants/zones";
import { riskColors } from "../constants/risk";
import { getZoneMetrics } from "../utils/zoneMetrics";
import { HealthArc } from "./HealthArc";
import type { Borrower, ZoneMetric } from "../types/borrower";

type RadialGraphImmersiveProps = {
    borrower: Borrower;
    canvasWidth: number;
    canvasHeight: number;
    onMetricClick: (metric: ZoneMetric, svgX: number, svgY: number) => void;
    onBackgroundClick?: () => void;
    activeZoneFilter?: ZoneId | null;
    onZoneFocus?: (zone: ZoneId | null) => void;
};

const CENTER_R = 74;
const HEALTH_ARC_R = 90;
const PADDING = 120;
const ZOOM = 1.18;

const HIGH_IMPORTANCE_METRICS = [
    "FICO Score",
    "Max DPD",
    "Total Loans",
    "Delinquency",
    "Annual Revenue",
    "Health Index",
];

function radians(deg: number) {
    return (deg * Math.PI) / 180;
}

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = radians(angleDeg);
    const stretchX = 1.7;
    return { x: cx + r * stretchX * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function RadialGraphImmersive({
    borrower,
    canvasWidth,
    canvasHeight,
    onMetricClick,
    onBackgroundClick,
    activeZoneFilter,
    onZoneFocus,
}: RadialGraphImmersiveProps) {
    const cx = canvasWidth / 2 - 90;
    const cy = canvasHeight / 2;

    const [internalFocusedZone, setInternalFocusedZone] = useState<ZoneId | null>(null);
    const focusedZone = activeZoneFilter !== undefined ? activeZoneFilter : internalFocusedZone;

    const handleZoneFocus = useCallback(
        (zoneId: ZoneId | null) => {
            if (onZoneFocus) onZoneFocus(zoneId);
            else setInternalFocusedZone(zoneId);
        },
        [onZoneFocus],
    );

    const [focusedMetricId, setFocusedMetricId] = useState<string | null>(null);
    const [hoveredMetricId, setHoveredMetricId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const uid = `rgi${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 200);
        return () => clearTimeout(t);
    }, []);

    const riskColor = riskColors[borrower.riskLevel];

    const handleMetricClick = useCallback(
        (
            e: React.MouseEvent,
            metric: ZoneMetric,
            metricId: string,
            zoneId: ZoneId,
            px: number,
            py: number,
        ) => {
            e.stopPropagation();
            handleZoneFocus(zoneId);
            setFocusedMetricId(metricId);

            if (!svgRef.current) return;
            const rect = svgRef.current.getBoundingClientRect();
            const vWidth = canvasWidth + PADDING * 2;
            const vHeight = canvasHeight + PADDING * 2;

            const visualPx = cx + (px - cx) * ZOOM;
            const visualPy = cy + (py - cy) * ZOOM;

            const htmlX = (visualPx + PADDING) * (rect.width / vWidth);
            const htmlY = (visualPy + PADDING) * (rect.height / vHeight);
            onMetricClick(metric, htmlX, htmlY);
        },
        [canvasWidth, canvasHeight, cx, cy, onMetricClick, handleZoneFocus],
    );

    const handleBgClick = useCallback(() => {
        handleZoneFocus(null);
        setFocusedMetricId(null);
        if (onBackgroundClick) onBackgroundClick();
    }, [handleZoneFocus, onBackgroundClick]);

    const allMetrics = useMemo(() => {
        const metricGroups = zones
            .map((zone) => ({
                zone,
                metrics: getZoneMetrics(borrower, zone.id),
            }))
            .filter((g) => g.metrics.length > 0);

        const totalMetrics = metricGroups.reduce((sum, g) => sum + g.metrics.length, 0);
        const numZones = metricGroups.length;

        const gapSlots = 1.5;
        const totalSlots = totalMetrics + numZones * gapSlots;
        const anglePerSlot = 360 / totalSlots;

        let currentAngle = -160;

        return metricGroups.flatMap((group) => {
            const groupMetrics = group.metrics.map((metric, i) => {
                const isImportant = HIGH_IMPORTANCE_METRICS.includes(metric.label);
                const isInner = i % 2 === 0;
                const radius = isInner ? 220 : 320;
                const angle = currentAngle;
                const pos = polarToXY(cx, cy, radius, angle);
                const metricId = `${group.zone.id}-${i}`;
                currentAngle += anglePerSlot;
                return { ...metric, zone: group.zone, metricId, pos, angle, radius, isImportant };
            });
            currentAngle += anglePerSlot * gapSlots;
            return groupMetrics;
        });
    }, [borrower, cx, cy]);

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
            @keyframes ${uid}centerBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
            @keyframes ${uid}slideIn { 0%{opacity:0;transform:scale(0.85) translateY(10px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
            @keyframes ${uid}edgeDraw { from{stroke-dashoffset:600;opacity:0} to{stroke-dashoffset:0;opacity:1} }
          `}</style>

                <radialGradient id={`${uid}cg`} cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F8FAFC" />
                </radialGradient>
                <filter id={`${uid}cs`} x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="rgba(15,23,42,0.06)" />
                </filter>
                <filter id={`${uid}ms`} x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="rgba(15,23,42,0.04)" />
                </filter>

                <pattern id={`${uid}grid`} width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1" fill="rgba(148,163,184,0.15)" />
                </pattern>
            </defs>

            {/* Background */}
            <rect
                x={-PADDING} y={-PADDING}
                width={canvasWidth + PADDING * 2} height={canvasHeight + PADDING * 2}
                fill="transparent"
            />
            <rect
                x={-PADDING} y={-PADDING}
                width={canvasWidth + PADDING * 2} height={canvasHeight + PADDING * 2}
                fill={`url(#${uid}grid)`}
                pointerEvents="none"
            />

            {/* Zoom wrapper */}
            <g transform={`translate(${cx}, ${cy}) scale(${ZOOM}) translate(${-cx}, ${-cy})`}>

                {/* Metric nodes */}
                {allMetrics.map((m, i) => {
                    const isFocused = focusedMetricId === m.metricId;
                    const isZoneActive = focusedZone === m.zone.id;
                    const isHovered = hoveredMetricId === m.metricId;

                    let nodeOpacity = 1;
                    let nodePointerEvents: "auto" | "none" = "auto";
                    if (focusedZone !== null) {
                        if (!isZoneActive) nodeOpacity = 0.3;
                        else if (focusedMetricId !== null && !isFocused) nodeOpacity = 0.7;
                        else nodeOpacity = 1;
                    }

                    const baseWidth = m.isImportant ? 150 : 155;
                    const baseHeight = m.isImportant ? 94 : 80;
                    const scale = isHovered || isFocused ? 1.05 : 1;
                    const cardW = baseWidth;
                    const cardH = baseHeight;
                    const cx_ = m.pos.x - cardW / 2;
                    const cy_ = m.pos.y - cardH / 2;

                    const severityColor =
                        m.severity === "good" ? "#16A34A" :
                            m.severity === "bad" ? "#DC2626" : "#64748B";

                    return (
                        <g
                            key={`m-${m.metricId}`}
                            style={{ opacity: nodeOpacity, pointerEvents: nodePointerEvents, transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1)" }}
                        >
                            <g
                                style={{
                                    animation: `${uid}slideIn 0.6s cubic-bezier(0.16,1,0.3,1) ${0.1 + i * 0.04}s both`,
                                    transformOrigin: `${m.pos.x}px ${m.pos.y}px`,
                                }}
                            >
                                <g
                                    style={{
                                        cursor: "pointer",
                                        transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), filter 0.4s ease",
                                        transform: `scale(${scale})`,
                                        transformOrigin: `${m.pos.x}px ${m.pos.y}px`,
                                        filter: isFocused ? `drop-shadow(0 0 12px ${m.zone.color}30)` : "none",
                                    }}
                                    onClick={(e) => handleMetricClick(e, m, m.metricId, m.zone.id, m.pos.x, m.pos.y)}
                                    onMouseEnter={() => setHoveredMetricId(m.metricId)}
                                    onMouseLeave={() => setHoveredMetricId(null)}
                                >
                                    <rect x={cx_} y={cy_} width={cardW} height={cardH} rx={12} fill="#FFFFFF" filter={`url(#${uid}ms)`} />
                                    <rect x={cx_} y={cy_} width={cardW} height={cardH} rx={12} fill={`${m.zone.color}08`} />
                                    <rect
                                        x={cx_} y={cy_} width={cardW} height={cardH} rx={12} fill="none"
                                        stroke={isFocused || isHovered ? m.zone.color : `${m.zone.color}30`}
                                        strokeWidth={isFocused ? 2 : isHovered ? 1.5 : 1}
                                        style={{ transition: "stroke 0.3s ease, stroke-width 0.3s ease" }}
                                    />
                                    {isFocused && (
                                        <rect x={cx_ + 16} y={cy_} width={cardW - 32} height={3} rx={1.5} fill={m.zone.color} />
                                    )}
                                    <text
                                        x={m.pos.x} y={cy_ + 22}
                                        textAnchor="middle" fontSize={m.isImportant ? "9.5" : "8.5"}
                                        fontWeight="700" fontFamily="Inter, sans-serif"
                                        fill={m.zone.color} letterSpacing="0.4"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {m.label.toUpperCase()}
                                    </text>
                                    <circle cx={cx_ + 16} cy={cy_ + 19} r={4} fill={severityColor} opacity={0.8} />
                                    <text
                                        x={m.pos.x} y={cy_ + (m.isImportant ? 52 : 46)}
                                        textAnchor="middle" fontSize={m.isImportant ? "18" : "15"}
                                        fontWeight="800" fontFamily="Inter, sans-serif"
                                        fill="#0F172A" letterSpacing="-0.5"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {m.value}
                                    </text>
                                    <text
                                        x={m.pos.x} y={cy_ + (m.isImportant ? 74 : 64)}
                                        textAnchor="middle" fontSize={m.isImportant ? "10" : "9"}
                                        fontWeight="500" fontFamily="Inter, sans-serif"
                                        fill="#64748B"
                                        style={{ pointerEvents: "none" }}
                                    >
                                        {m.sub}
                                    </text>
                                </g>
                            </g>
                        </g>
                    );
                })}

                {/* Center node */}
                <g
                    style={{
                        transformOrigin: `${cx}px ${cy}px`,
                        animation: `${uid}centerBreathe 6s ease-in-out infinite`,
                        pointerEvents: "none",
                    }}
                >
                    {mounted && (
                        <HealthArc
                            cx={cx} cy={cy} r={HEALTH_ARC_R}
                            value={borrower.borrower_health_index}
                            riskLevel={borrower.riskLevel}
                            strokeWidth={5}
                        />
                    )}
                    <circle cx={cx} cy={cy} r={CENTER_R + 14} fill="none" stroke={riskColor.ring} strokeWidth="1" opacity="0.3" strokeDasharray="4 6" />
                    <circle cx={cx} cy={cy} r={CENTER_R} fill={`url(#${uid}cg)`} stroke={riskColor.border} strokeWidth="2" filter={`url(#${uid}cs)`} />
                    <text x={cx} y={cy - 18} textAnchor="middle" fontSize="24" fontWeight="800" fontFamily="Inter, sans-serif" fill="#0F172A" letterSpacing="-1">
                        {borrower.initials}
                    </text>
                    <text x={cx} y={cy - 2} textAnchor="middle" fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif" fill="#94A3B8" letterSpacing="1">
                        HEALTH INDEX
                    </text>
                    <text x={cx} y={cy + 24} textAnchor="middle" fontSize="28" fontWeight="800" fontFamily="Inter, sans-serif" fill={riskColor.dot} letterSpacing="-1">
                        {borrower.borrower_health_index}
                    </text>
                    <rect x={cx - 36} y={cy + 32} width={72} height={20} rx={10} fill={riskColor.bg} stroke={riskColor.border} strokeWidth="1.5" />
                    <text x={cx} y={cy + 46} textAnchor="middle" fontSize="8.5" fontWeight="700" fontFamily="Inter, sans-serif" fill={riskColor.text} letterSpacing="0.5">
                        {borrower.riskLabel.toUpperCase()}
                    </text>
                </g>

            </g>
        </svg>
    );
}