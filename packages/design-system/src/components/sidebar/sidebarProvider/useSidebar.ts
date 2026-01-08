/**
 * External dependencies
 */
import { useContextSelector } from '@google-awlt/common';
/**
 * Internal dependencies.
 */
import Context, { type SidebarContextProps } from './context';

export function useSidebar(): SidebarContextProps;
export function useSidebar<T>(selector: (state: SidebarContextProps) => T): T;

/**
 * Allowed list hook.
 * @param selector Selector function to partially select state.
 * @returns selected part of the state
 */
export function useSidebar<T>(
	selector: (state: SidebarContextProps) => T | SidebarContextProps = (
		state
	) => state
) {
	return useContextSelector(Context, selector);
}

export default useSidebar;
