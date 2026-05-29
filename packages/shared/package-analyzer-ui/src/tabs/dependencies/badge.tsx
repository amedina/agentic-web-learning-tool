/**
 * External dependencies.
 */
import React from "react";

export interface BadgeProps {
  color: string;
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}

/**
 * Compact pill that signals one of the tab's key parameters
 * (vulnerabilities / license issues / replaceable) on an accordion trigger.
 * Uses the canonical color from `DEPENDENCIES_COLORS` so the same parameter
 * looks the same in the dashboard pie/matrix and in the accordion row badge.
 */
export const Badge: React.FC<BadgeProps> = ({
  color,
  icon,
  title,
  children,
}) => (
  <span
    title={title}
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
    style={{
      backgroundColor: `${color}20`,
      color,
    }}
  >
    {icon}
    {children}
  </span>
);
