/**
 * Internal dependencies
 */
import { DEFAULT_AGENTS } from "../../constants";

export const onInstalledCallback = async ({ reason }: chrome.runtime.InstalledDetails) => {
	if (reason === 'install') {
		await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
	}

};
