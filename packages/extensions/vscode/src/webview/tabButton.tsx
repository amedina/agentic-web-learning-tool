/**
 * External dependencies.
 */
import { type FC } from "react";

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

/** A single tab button within the {@link TabBar} strip. */
export const TabButton: FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      type="button"
      className={`px-3 py-2 border-b-2 -mb-px ${
        isActive
          ? "border-sky-500 text-slate-900 dark:text-slate-100"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};
