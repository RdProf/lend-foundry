import { useReducedMotion } from "framer-motion";

export function useMotionConfig() {
  const shouldReduceMotion = useReducedMotion();

  // Cubic ease-in-out for layout transitions (~400ms feel)
  const cinematicTransition = {
    duration: shouldReduceMotion ? 0 : 0.4,
    ease: [0.65, 0, 0.35, 1] as [number, number, number, number], // cinematic cubic-bezier
  };

  return {
    shouldReduceMotion,
    cinematicTransition,
    staggerDelay: shouldReduceMotion ? 0 : 0.05,
    baseDelay: shouldReduceMotion ? 0 : 0.6,
  };
}
