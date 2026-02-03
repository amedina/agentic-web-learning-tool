/**
 * Internal dependencies
 */
import { settingsSetter, setLogLevelFromSyncSettings } from '../../utils';
import type { AgentType, SettingsState } from '../../types';
import { DEFAULT_SETTINGS } from '../../constants';
import { mcpbTools } from '../../contentScript/tools/builtInTools';

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
    const chromeAPIBuiltInToolsState: { [key: string]: { enabled: boolean } } =
      {};

    Object.keys(mcpbTools).forEach(
      (tool) =>
        (chromeAPIBuiltInToolsState[tool] = {
          enabled: true,
        })
    );

    await chrome.storage.local.set({
      chromeAPIBuiltInToolsState,
    });
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
    chrome.storage.sync.get('extensionSettings').then(async (data) => {
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

    const { chromeAPIBuiltInToolsState } = await chrome.storage.local.get(
      'chromeAPIBuiltInToolsState'
    );

    if (!chromeAPIBuiltInToolsState) {
      const chromeAPIBuiltInToolsState: {
        [key: string]: { enabled: boolean };
      } = {};

      Object.keys(mcpbTools).forEach(
        (tool) =>
          (chromeAPIBuiltInToolsState[tool] = {
            enabled: true,
          })
      );

      await chrome.storage.local.set({
        chromeAPIBuiltInToolsState,
      });
    }
  }

  await setLogLevelFromSyncSettings();
};

export default onInstalledCallback;
