/**
 * External dependencies
 */
import { useContextSelector } from "@google-awlt/common";
/**
 * Internal dependencies.
 */
import Context, { type PropProviderType } from "./context";

export function usePropProvider(): PropProviderType;
export function usePropProvider<T>(selector: (state: PropProviderType) => T): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function usePropProvider<T>(
  selector: (state: PropProviderType) => T | PropProviderType = (state) =>
    state,
) {
  return useContextSelector(Context, selector);
}

export default usePropProvider;
