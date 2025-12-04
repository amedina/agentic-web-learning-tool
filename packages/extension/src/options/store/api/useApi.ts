import { apiUseContextSelector, type ApiStoreContext } from './context';

export function useApi(): ApiStoreContext;
export function useApi<T>(selector: (state: ApiStoreContext) => T): T;

export function useApi<T>(
	selector: (state: ApiStoreContext) => T | ApiStoreContext = (state) => state
) {
	return apiUseContextSelector(selector);
}

export default useApi;
