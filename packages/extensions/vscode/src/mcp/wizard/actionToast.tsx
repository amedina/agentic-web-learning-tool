/**
 * External dependencies.
 */
import { type FC } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { McpActionResult } from "./protocol";
import { PILL_STYLES, type PillProps } from "./pill";

interface ActionToastProps {
  result: McpActionResult;
  onDismiss: () => void;
}

/**
 * Inline toast strip rendered at the bottom of a card. Keeps action
 * results scoped to the card that fired them — no global modals — so
 * the user can see "Installed for Cursor" while still reading the
 * Claude Desktop card above it.
 */
export const ActionToast: FC<ActionToastProps> = ({ result, onDismiss }) => {
  const tone: PillProps["tone"] = !result.ok
    ? "danger"
    : result.nothingToDo
      ? "muted"
      : "success";
  const Icon = !result.ok
    ? AlertTriangle
    : result.nothingToDo
      ? Info
      : CheckCircle2;
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
      style={{
        ...PILL_STYLES[tone],
        borderColor: PILL_STYLES[tone].color as string,
      }}
    >
      <Icon size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">{result.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
};
