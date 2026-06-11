/**
 * External dependencies.
 */
import { createContext, useContext, type FC, type ReactNode } from "react";

/**
 * Internal dependencies.
 */
import type { MuteTarget, SuppressionEntry } from "../../projectHealth/types";

/**
 * The suppression state plus the two mutators every finding row needs to
 * mute or unmute itself. Lifted into context so the list/row/details
 * components do not have to prop-drill it down to each item.
 */
export interface SuppressionContextValue {
  /** The current set of persisted mutes for this workspace. */
  suppressions: SuppressionEntry[];
  /** Mute a finding, optionally recording why it was accepted. */
  onMute: (target: MuteTarget, reason?: string) => void;
  /** Remove an existing mute so the finding is shown again. */
  onUnmute: (target: MuteTarget) => void;
}

/**
 * Safe no-op fallback so an item rendered outside a provider degrades to
 * "nothing is muted and mute/unmute do nothing" instead of crashing.
 */
const defaultValue: SuppressionContextValue = {
  suppressions: [],
  onMute: () => {},
  onUnmute: () => {},
};

const SuppressionContext = createContext<SuppressionContextValue>(defaultValue);

interface SuppressionProviderProps {
  /** The suppression state + mutators to expose to descendants. */
  value: SuppressionContextValue;
  children: ReactNode;
}

/**
 * Provides the {@link SuppressionContextValue} to its subtree so finding
 * items can read the current mutes and call mute/unmute without the
 * intervening list/row/details components having to forward props.
 */
export const SuppressionProvider: FC<SuppressionProviderProps> = ({
  value,
  children,
}) => {
  return (
    <SuppressionContext.Provider value={value}>
      {children}
    </SuppressionContext.Provider>
  );
};

/**
 * Reads the suppression context. Returns the safe no-op default when used
 * outside a {@link SuppressionProvider}, so individual items never crash.
 */
export function useSuppression(): SuppressionContextValue {
  return useContext(SuppressionContext);
}
