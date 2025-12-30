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
import Logger, { type LogLevelDesc } from 'loglevel';
/**
 * Internal dependencies
 */
import type { LogLevel, SettingsState, ThemeMode } from '../../../types';
import SettingsContext, { type SettingsContextProps } from './context';
import { settingsGetter, settingsSetter } from '../../../utils/settingsGetter';

function SettingsProvider({
	children,
	view,
}: PropsWithChildren & { view: 'options' | 'sidepanel' | 'devtools' }) {
	const initialFetch = useRef(false);
	const [theme, setTheme] = useState<SettingsState['theme']>('auto');
	const [logLevel, setLogLevel] =
		useState<SettingsState['logLevel']>('SILENT');

	const fetchAndUpdateSettings = useCallback(async () => {
		const { theme: _theme, logLevel: _logLevel } = await settingsGetter();

		setTheme(_theme);
		setLogLevel(_logLevel);
	}, []);

	const clearSettings = useCallback(() => {
		setTheme('auto');
		setLogLevel('SILENT');
		chrome.storage.sync.clear();
	}, []);

	const syncStorageChangedListener = useCallback(() => {
		if (!initialFetch.current || view === 'options') {
			return;
		}

		fetchAndUpdateSettings();
	}, [fetchAndUpdateSettings]);

	useEffect(() => {
		if (theme === 'auto') {
			const isDarkMode =
				window.matchMedia &&
				window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (isDarkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		} else if (theme === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [theme]);

	useEffect(() => {
		Logger.setLevel(logLevel.toLowerCase() as LogLevelDesc);
	}, [logLevel]);

	const toggleSettings = useCallback(
		(key: 'theme' | 'logLevel', value: ThemeMode | LogLevel) => {
			if (key === 'theme') {
				setTheme(value as ThemeMode);
			}

			if (key === 'logLevel') {
				setLogLevel(value as LogLevel);
			}

			settingsSetter(key, value);
		},
		[]
	);

	useEffect(() => {
		(async () => {
			await fetchAndUpdateSettings();
			initialFetch.current = true;
		})();

		chrome.storage.onChanged.addListener(syncStorageChangedListener);

		return () => {
			chrome.storage.onChanged.removeListener(syncStorageChangedListener);
		};
	}, [fetchAndUpdateSettings, syncStorageChangedListener]);

	const contextValue = useMemo<SettingsContextProps>(
		() => ({
			state: {
				theme,
				logLevel,
			},
			actions: {
				clearSettings,
				toggleSettings,
			},
		}),
		[logLevel, theme, clearSettings]
	);

	return (
		<SettingsContext.Provider value={contextValue}>
			{children}
		</SettingsContext.Provider>
	);
}

export default SettingsProvider;
