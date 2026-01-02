/**
 * Internal dependencies
 */
import { DEFAULT_AGENTS } from "../../constants";

const onInstalledCallback = async ({ reason }: chrome.runtime.InstalledDetails) => {
	if (reason === 'install') {
		await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
		await chrome.storage.sync.set({
			extensionSettings: JSON.stringify({ theme: 'auto', logLevel: 'SILENT' }),
		});
	}

	if (reason === 'update') {
		await chrome.storage.sync.get('agents').then(async (data) => {
			if (!data.agents || (Array.isArray(data.agents) && data.agents.length === 0)) {
				await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
			}
		});
		await chrome.storage.sync.get('extensionSettings').then(async (data) => {
			const json = JSON.parse((data.extensionSettings ?? '{}') as string);
			if (!json.theme && !json.logLevel) {
				await chrome.storage.sync.set({
					extensionSettings: JSON.stringify({ theme: 'auto', logLevel: 'SILENT' }),
				});
			}
		})
	}

};

export default onInstalledCallback;