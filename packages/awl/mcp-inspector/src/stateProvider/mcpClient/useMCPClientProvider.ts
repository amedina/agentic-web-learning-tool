/**
 * External dependencies
 */
import { useContextSelector } from "@google-awlt/common";
/**
 * Internal dependencies.
 */
import Context, { type McpConnectionContextType } from "./context";

export function useMCPClientProvider(): McpConnectionContextType;
export function useMCPClientProvider<T>(
  selector: (state: McpConnectionContextType) => T,
): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useMCPClientProvider<T>(
  selector: (
    state: McpConnectionContextType,
  ) => T | McpConnectionContextType = (state) => state,
) {
  return useContextSelector(Context, selector);
}

export default useMCPClientProvider;
