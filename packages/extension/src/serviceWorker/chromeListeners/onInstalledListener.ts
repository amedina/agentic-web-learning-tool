/**
 * Internal dependencies
 */
import { DEFAULT_AGENTS } from "../../constants";

const onInstalledCallback = async ({ reason }: chrome.runtime.InstalledDetails) => {
	if (reason === 'install') {
		await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
	}

	if (reason === 'update') {
		await chrome.storage.sync.get('agents').then(async (data) => {
			if (!data.agents || (Array.isArray(data.agents) && data.agents.length === 0)) {
				await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
			}
		});
	}

};

export default onInstalledCallback;