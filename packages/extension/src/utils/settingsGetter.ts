/**
 * Internal dependencies
 */
import type { ThemeMode, LogLevel, SettingsState } from '../types';

async function settingsGetter() {
	const { theme = 'auto', logLevel = 'silent' } =
		await chrome.storage.sync.get(['theme', 'logLevel']);

	return { theme, logLevel } as SettingsState
}

async function settingsSetter(key: keyof SettingsState, value: ThemeMode | LogLevel) {
	await chrome.storage.sync.set({
		extensionSettings: { [key]: value },
	});
}

export { settingsGetter, settingsSetter };
