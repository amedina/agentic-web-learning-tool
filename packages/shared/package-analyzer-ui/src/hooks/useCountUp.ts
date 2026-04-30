/**
 * External dependencies.
 */
import { useEffect, useState } from "react";

/**
 * Animates a numeric value from 0 up to `target` over `durationMs` using
 * an ease-out cubic curve. Used by the Insights widgets so headline
 * numbers (Fitness Score, bundle size, responsiveness %, etc.) look like
 * they're filling in as data lands rather than snapping into place after
 * the skeleton — a perception-only fix while the underlying fetch stays
 * a single Promise.all.
 *
 * Restarts from 0 whenever `target` changes (e.g. user navigates to a
 * different package) so the animation is consistent per-package rather
 * than tweening between two real values.
 */
const DEFAULT_DURATION_MS = 800;

export const useCountUp = (
  target: number,
  durationMs: number = DEFAULT_DURATION_MS,
): number => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(target);
      return;
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
