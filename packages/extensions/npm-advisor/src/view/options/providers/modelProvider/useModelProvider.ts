/**
 * External dependencies
 */
import { useContext } from "react";

/**
 * Internal dependencies
 */
import Context, { type ModelProviderStoreContext } from "./context";

export function useModelProvider(): ModelProviderStoreContext;
export function useModelProvider<T>(
  selector: (state: ModelProviderStoreContext) => T,
): T;

export function useModelProvider<T>(
  selector?: (state: ModelProviderStoreContext) => T,
) {
  const context = useContext(Context);
  if (selector) {
    return selector(context);
  }
  return context;
}

export default useModelProvider;
