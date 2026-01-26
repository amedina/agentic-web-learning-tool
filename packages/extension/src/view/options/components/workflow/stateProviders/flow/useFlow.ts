/**
 * Internal dependencies
 */
import { flowUseContextSelector, type FlowStoreContext } from './context';

export function useFlow(): FlowStoreContext;
export function useFlow<T>(selector: (state: FlowStoreContext) => T): T;

export function useFlow<T>(
  selector: (state: FlowStoreContext) => T | FlowStoreContext = (state) => state
) {
  return flowUseContextSelector(selector);
}

export default useFlow;
