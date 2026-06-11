/**
 * External dependencies.
 */
import { type CSSProperties, type FC, type ReactNode } from "react";

export interface PillProps {
  tone: "success" | "warning" | "muted" | "danger";
  icon: ReactNode;
  label: string;
}

/**
 * Tone-keyed pill style. Pulls foreground color from VSCode's editor
 * variables so the text reads correctly on any theme; the soft
 * background uses a `color-mix` against the same variable so it
 * tints automatically with the user's accent.
 */
export const PILL_STYLES: Record<PillProps["tone"], CSSProperties> = {
  success: {
    color: "var(--vscode-charts-green, #16a34a)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-charts-green, #16a34a) 18%, transparent)",
  },
  warning: {
    color: "var(--vscode-editorWarning-foreground, #d97706)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-editorWarning-foreground, #d97706) 18%, transparent)",
  },
  muted: {
    color: "var(--vscode-descriptionForeground)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-foreground) 10%, transparent)",
  },
  danger: {
    color: "var(--vscode-editorError-foreground, #dc2626)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-editorError-foreground, #dc2626) 18%, transparent)",
  },
};

/** Tiny labelled badge used by `StatusBadge`. */
export const Pill: FC<PillProps> = ({ tone, icon, label }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
    style={PILL_STYLES[tone]}
  >
    {icon}
    {label}
  </span>
);
