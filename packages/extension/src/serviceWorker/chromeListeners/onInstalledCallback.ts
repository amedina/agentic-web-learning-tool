/**
 * Internal dependencies
 */
import { settingsSetter, setLogLevelFromSyncSettings } from "../../utils";
import type { AgentType, SettingsState } from "../../types";
import { DEFAULT_SETTINGS } from "../../constants";

const onInstalledCallback = async (details: chrome.runtime.InstalledDetails) => {
    if (details.reason === 'install') {
        chrome.storage.sync.set({ selectedAgent: { model: 'prompt-api', modelProvider: 'browser-ai' } })
        Object.entries(DEFAULT_SETTINGS).map(([key, value]) => settingsSetter(key as keyof SettingsState, value))
    }

    if (details.reason === 'update') {
        const { selectedAgent }: { selectedAgent: AgentType } =
            await chrome.storage.sync.get('selectedAgent');
        if(!selectedAgent){
            chrome.storage.sync.set({ selectedAgent: { model: 'prompt-api', modelProvider: 'browser-ai' } })
        }
    }
    await setLogLevelFromSyncSettings();
};

export default onInstalledCallback;