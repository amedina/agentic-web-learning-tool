/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 up to `target` over `durationMs` using
 * an ease-out cubic curve. Used by the Insights widgets so headline
 * numbers (Fitness Score, bundle size, responsiveness %, etc.) look like
 * they're filling in as data lands rather than snapping into place after
 * the skeleton — a perception-only fix while the underlying fetch stays
 * a single Promise.all.
 *
 * Snaps without animating when the first positive `target` arrives
 * within CACHED_THRESHOLD_MS of mount. That window catches cached data
 * flowing through the parent's async state (where `target` shows up as
 * `0` for one render and the real value the next), so re-opening the
 * side panel for an already-analysed package is instant. Fresh fetches
 * (500 ms+) and subsequent target changes (e.g. package switches) still
 * animate.
 */
const DEFAULT_DURATION_MS = 800;
const CACHED_THRESHOLD_MS = 200;

export const useCountUp = (
  target: number,
  durationMs: number = DEFAULT_DURATION_MS,
): number => {
  const [value, setValue] = useState(target);
  const mountTimeRef = useRef(performance.now());
  const hasResolvedRef = useRef(false);

  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
    }

    if (!hasResolvedRef.current) {
      hasResolvedRef.current = true;
      const elapsedSinceMount = performance.now() - mountTimeRef.current;
      if (elapsedSinceMount < CACHED_THRESHOLD_MS) {
        setValue(target);
        return;
      }
    }

    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, durationMs]);

  return value;
};
