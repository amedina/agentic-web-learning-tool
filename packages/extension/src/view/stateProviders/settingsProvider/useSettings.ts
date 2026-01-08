/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type SettingsContextProps } from './context';

export function useSettings(): SettingsContextProps;
export function useSettings<T>(selector: (state: SettingsContextProps) => T): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useSettings<T>(
	selector: (state: SettingsContextProps) => T | SettingsContextProps = (
		state
	) => state
) {
	return useContextSelector(Context, selector);
}

export default useSettings;
