/**
 * Internal dependencies.
 */
import Context, { type ModelProviderStoreContext } from './context';
import { useContextSelector } from '../../../../utils';

export function useModelProvider(): ModelProviderStoreContext;
export function useModelProvider<T>(selector: (state: ModelProviderStoreContext) => T): T;

/**
 * Cookie store hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useModelProvider<T>(
  selector: (state: ModelProviderStoreContext) => T | ModelProviderStoreContext = (state) =>
    state
) {
  return useContextSelector(Context, selector);
}

export default useModelProvider;
