/**
 * Internal dependencies
 */
import { settingsSetter, setLogLevelFromSyncSettings } from '../../utils';
import type { AgentType, SettingsState } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants';

const onInstalledCallback = async (
  details: chrome.runtime.InstalledDetails
) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({
      selectedAgent: { model: 'prompt-api', modelProvider: 'browser-ai' },
    });
    await Promise.all(
      Object.entries(DEFAULT_SETTINGS).map(
        async ([key, value]) =>
          await settingsSetter(key as keyof SettingsState, value)
      )
    );
  }

  if (details.reason === 'update') {
    const { selectedAgent }: { selectedAgent: AgentType } =
      await chrome.storage.sync.get('selectedAgent');
    if (!selectedAgent) {
      chrome.storage.sync.set({
        selectedAgent: {
          model: 'prompt-api',
          modelProvider: 'browser-ai',
        },
      });
    }
    await chrome.storage.sync.get('extensionSettings').then(async (data) => {
      const json = JSON.parse((data.extensionSettings ?? '{}') as string);
      if (!json.theme && !json.logLevel) {
        await chrome.storage.sync.set({
          extensionSettings: JSON.stringify({
            theme: 'auto',
            logLevel: 'SILENT',
          }),
        });
      }
    });
  }
  await setLogLevelFromSyncSettings();
};

export default onInstalledCallback;
