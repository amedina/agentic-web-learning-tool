/**
 * Internal dependencies
 */
import { useContextSelector } from "@google-awlt/common";
import ApiContext, { type ApiStoreContext } from "./context";

export function useApi(): ApiStoreContext;
export function useApi<T>(selector: (state: ApiStoreContext) => T): T;

export function useApi<T>(
  selector: (state: ApiStoreContext) => T | ApiStoreContext = (state) => state,
) {
  return useContextSelector(ApiContext, selector);
}

export default useApi;
