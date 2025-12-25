/**
 * External dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type PropsWithChildren,
} from 'react';
/**
 * Internal dependencies
 */
import type { SettingsState } from '../../../types';
import SettingsContext, { type SettingsContextProps } from './context';
import { settingsGetter } from '../../../utils/settingsGetter';

function SettingsProvider({ children }: PropsWithChildren) {
	const initialFetch = useRef(false);
	const [theme, setTheme] = useState<SettingsState['theme']>('auto');
	const [logLevel, setLogLevel] =
		useState<SettingsState['logLevel']>('SILENT');

	const fetchAndUpdateSettings = useCallback(async () => {
		const { theme: _theme, logLevel: _logLevel } = await settingsGetter();
		setTheme(_theme);
		setLogLevel(_logLevel);
	}, []);

	const syncStorageChangedListener = useCallback(() => {
		if (!initialFetch.current) {
			return;
		}

		fetchAndUpdateSettings();
	}, []);

	useEffect(() => {
		(async () => {
			await fetchAndUpdateSettings();
			initialFetch.current = true;
		})();

		chrome.storage.onChanged.addListener(syncStorageChangedListener);

		return () => {
			chrome.storage.onChanged.removeListener(
				syncStorageChangedListener
			);
		};
	}, [fetchAndUpdateSettings, syncStorageChangedListener]);

	const contextValue = useMemo<SettingsContextProps>(
		() => ({
			state: {
				theme,
				logLevel,
			},
		}),
		[logLevel, theme]
	);

	return (
		<SettingsContext.Provider value={contextValue}>
			{children}
		</SettingsContext.Provider>
	);
}

export default SettingsProvider;
