/**
 * External dependencies.
 */
import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from its current displayed value up to `target`
 * over `durationMs` using an ease-out cubic curve. Used by the Insights
 * widgets so headline numbers (Fitness Score, bundle size, responsiveness
 * %, etc.) look like they're filling in as data lands rather than
 * snapping into place after the skeleton — a perception-only fix while
 * the underlying fetch stays a single Promise.all.
 *
 * Skips the animation on the very first effect run so a remount with
 * already-cached data (e.g. user re-opens the side panel for a package
 * they've already analysed) snaps to the final value instead of
 * counting up again. Subsequent target changes — fresh fetches, package
 * switches — animate as expected.
 */
const DEFAULT_DURATION_MS = 800;

export const useCountUp = (
  target: number,
  durationMs: number = DEFAULT_DURATION_MS,
): number => {
  const [value, setValue] = useState(target);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      setValue(target);
      return;
    }

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
