/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps {
  icon: ReactNode;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export const BUTTON_BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Solid button used for the most prominent action on each card
 * (Install / Run in terminal). Uses VSCode's button-color variables
 * so it matches whatever accent / theme the user has active.
 */
export const PrimaryButton: FC<ButtonProps> = ({
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
    className={`${BUTTON_BASE} mcp-button-primary`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {label}
  </button>
);
