// src/components/shared/IntelligenceGraph.tsx

import { useState, useRef, useCallback, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionConfig } from "../../hooks/useMotion";
import { RadialGraph } from "../RadialGraph";
import { RadialGraphImmersive } from "../RadialGraphImmersive";
import { InsightCard } from "../InsightCard";
import { FloatingGraphControls } from "./FloatingGraphControls";
import { ContextualInsightOverlay } from "./ContextualInsightOverlay";
import { zones } from "../../constants/zones";
import type { ZoneId } from "../../constants/zones";
import type { Borrower, ZoneMetric } from "../../types/borrower";

type InsightState = { metric: ZoneMetric; x: number; y: number } | null;

export interface IntelligenceGraphProps {
  borrower: Borrower;
  immersive: boolean;
  className?: string;
}

export const IntelligenceGraph = memo(function IntelligenceGraph({
  borrower,
  immersive,
  className = "",
}: IntelligenceGraphProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [insight, setInsight] = useState<InsightState>(null);
  const [showContextOverlay, setShowContextOverlay] = useState(true);
  const [activeZoneFilter, setActiveZoneFilter] = useState<ZoneId | null>(null);
  const { baseDelay } = useMotionConfig();

  useEffect(() => {
    setShowContextOverlay(true);
    setActiveZoneFilter(null);
  }, [borrower.borrowerid]);

  useEffect(() => {
    if (!immersive) setActiveZoneFilter(null);
  }, [immersive]);

  useEffect(() => {
    const measure = () => {
      if (canvasRef.current) {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width, height });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, []);

  const handleMetricClick = useCallback(
    (metric: ZoneMetric, x: number, y: number) => setInsight({ metric, x, y }),
    []
  );

  const closeInsight = useCallback(() => setInsight(null), []);
  const handleZoneFocus = useCallback((zone: ZoneId | null) => setActiveZoneFilter(zone), []);

  return (
    <div
      ref={canvasRef}
      className={`relative min-h-0 flex-1 overflow-hidden ${className}`}
      style={{ background: "var(--color-bg)" }}
    >
      {canvasSize.width > 0 && (
        immersive ? (
          // ── Immersive mode: use the cinematic card-orbital graph from random frontend
          <RadialGraphImmersive
            borrower={borrower}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            onMetricClick={handleMetricClick}
            onBackgroundClick={closeInsight}
            activeZoneFilter={activeZoneFilter}
            onZoneFocus={handleZoneFocus}
          />
        ) : (
          // ── Workspace mode: use the compact spoke graph
          <RadialGraph
            borrower={borrower}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            onMetricClick={handleMetricClick}
            compact={true}
          />
        )
      )}

      {insight && (
        <div className="pointer-events-none absolute inset-0 z-20">
          <InsightCard
            metric={insight.metric}
            x={insight.x}
            y={insight.y}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            onClose={closeInsight}
          />
        </div>
      )}

      {/* Immersive-only: floating hint */}
      <AnimatePresence>
        {immersive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            transition={{ delay: baseDelay, duration: 0.4 }}
            className="pointer-events-none absolute bottom-3 right-4 z-10"
          >
            <span className="rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.85)] px-[10px] py-[4px] text-[10.5px] font-medium text-[var(--color-text-tertiary)] backdrop-blur-sm">
              ↗ Click a domain to explore metrics
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive-only: floating zone focus filter panel */}
      <AnimatePresence>
        {immersive && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
            transition={{ delay: baseDelay + 0.1, duration: 0.4 }}
            className="absolute bottom-12 right-6 z-30 flex flex-col items-end gap-2"
          >
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[1px] text-[#94A3B8]">
              Focus Area
            </div>
            {zones.map((z) => {
              const isActive = activeZoneFilter === z.id;
              return (
                <button
                  key={z.id}
                  onClick={() => handleZoneFocus(isActive ? null : z.id)}
                  className={[
                    "flex w-[190px] cursor-pointer items-center rounded-[10px] border px-3 py-2 text-[12px] font-semibold transition-all duration-200",
                    isActive
                      ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                      : "bg-[rgba(248,250,252,0.85)] backdrop-blur-sm hover:bg-white hover:shadow-sm",
                  ].join(" ")}
                  style={{
                    borderColor: isActive ? z.color : "#E2E8F0",
                    color: isActive ? z.color : "#475569",
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[12px]"
                      style={{
                        backgroundColor: isActive ? `${z.color}18` : "#F1F5F9",
                        color: isActive ? z.color : "#64748B",
                      }}
                    >
                      {z.icon}
                    </span>
                    {z.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {immersive && <FloatingGraphControls />}
      <AnimatePresence>
        {immersive && showContextOverlay && (
          <ContextualInsightOverlay
            borrower={borrower}
            onClose={() => setShowContextOverlay(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
});