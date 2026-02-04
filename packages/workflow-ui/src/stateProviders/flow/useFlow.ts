/**
 * Internal dependencies
 */
import { useContextSelector } from "@google-awlt/common";
import FlowContext, { type FlowStoreContext } from "./context";

export function useFlow(): FlowStoreContext;
export function useFlow<T>(selector: (state: FlowStoreContext) => T): T;

export function useFlow<T>(
  selector: (state: FlowStoreContext) => T | FlowStoreContext = (state) =>
    state,
) {
  return useContextSelector(FlowContext, selector);
}

export default useFlow;
