/**
 * External dependencies.
 */
import { type FC, type ReactNode } from "react";

export interface OverflowItem {
  key: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

interface OverflowMenuItemProps {
  item: OverflowItem;
}

/**
 * Single row inside `ClientCardOverflow`'s menu. Disabled items stay
 * visible (dimmed) so users see every option even when it's not
 * applicable yet — a "View backups (0)" tells the user backups
 * exist as a concept on this card, just not yet for them.
 */
export const OverflowMenuItem: FC<OverflowMenuItemProps> = ({ item }) => (
  <button
    type="button"
    role="menuitem"
    disabled={item.disabled}
    onClick={item.onClick}
    className={`mcp-overflow-item ${item.danger ? "mcp-overflow-item-danger" : ""}`}
  >
    <span className="shrink-0">{item.icon}</span>
    <span className="flex-1 text-left">{item.label}</span>
  </button>
);
