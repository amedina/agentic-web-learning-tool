/**
 * External dependencies.
 */
import React from "react";

export interface ClickableCircleProps {
  title: string;
  onTrigger: (title: string) => void;
  /**
   * When false the circle renders as a static div instead of a button
   * — used for "no results" tiles where filtering yields an empty
   * list and the affordance just frustrates the user.
   */
  interactive: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a CirclePieChart in a button so the same `handleTileClick` mapping
 * used by the Matrix tiles also fires on circle clicks. Kept inline because
 * the wiring is specific to this tab; the design-system CirclePieChart
 * deliberately stays click-agnostic. When `interactive` is false the circle
 * renders as a plain div so it doesn't carry hover / focus affordances for a
 * click that wouldn't filter anything in.
 */
export const ClickableCircle: React.FC<ClickableCircleProps> = ({
  title,
  onTrigger,
  interactive,
  children,
}) => {
  if (!interactive) {
    return <div className="p-0 m-0 flex-1 basis-0 min-w-0">{children}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => onTrigger(title)}
      aria-label={`Filter by ${title}`}
      className="cursor-pointer bg-transparent border-0 p-0 m-0 text-inherit focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md flex-1 basis-0 min-w-0"
    >
      {children}
    </button>
  );
};
