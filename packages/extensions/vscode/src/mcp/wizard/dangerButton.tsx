/**
 * External dependencies.
 */
import { type FC } from "react";
import { Loader2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { BUTTON_BASE, type ButtonProps } from "./primaryButton";

/** Red-tinted button for destructive actions (Remove). */
export const DangerButton: FC<ButtonProps> = ({
  icon,
  label,
  loading,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_BASE} mcp-button-danger`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {label}
  </button>
);
