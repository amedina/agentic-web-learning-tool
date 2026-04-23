/**
 * External dependencies.
 */
import React from "react";

interface StatCircleProps {
  value: number | string;
  label: string;
  /** Fraction between 0 and 1 for the colored arc. */
  ratio?: number;
  accentClassName?: string;
}

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const StatCircle: React.FC<StatCircleProps> = ({
  value,
  label,
  ratio,
  accentClassName = "text-[#c94137]",
}) => {
  const safeRatio =
    ratio === undefined || Number.isNaN(ratio)
      ? 0
      : Math.max(0, Math.min(1, ratio));
  const arcOffset = CIRCUMFERENCE * (1 - safeRatio);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            className="text-slate-200 dark:text-slate-700"
            stroke="currentColor"
          />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={arcOffset}
            className={accentClassName}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {value}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs text-center text-slate-600 dark:text-slate-400 leading-tight max-w-[100px]">
        {label}
      </span>
    </div>
  );
};
