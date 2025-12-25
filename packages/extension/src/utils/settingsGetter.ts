/**
 * Internal dependencies
 */
import type { ThemeMode, LogLevel, SettingsState } from '../types';

async function settingsGetter() {
	const { theme = 'auto', logLevel = 'silent' } =
		JSON.parse((await chrome.storage.sync.get('extensionSettings')).extensionSettings as string);

	return { theme, logLevel } as SettingsState
}

async function settingsSetter(key: keyof SettingsState, value: ThemeMode | LogLevel) {
	const { theme, logLevel } = await settingsGetter();

	await chrome.storage.sync.set({
		extensionSettings: JSON.stringify({ theme: theme, logLevel: logLevel, [key]: value }),
	});
}

export { settingsGetter, settingsSetter };
