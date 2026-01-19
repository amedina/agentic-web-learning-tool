/**
 * External dependencies
 */
import { useCallback, useState } from 'react';
import { OptionsPageTab, type PromptCommand } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import ResetConfirmationDialog from './resetConfirmationDialog';
import ThemeSection from './themeToggleSection';
import DataManagementSection from './dataManagementSection';
import SystemSection from './systemSection';
import { useSettings } from '../../../stateProviders';
import {
  useMcpProvider,
  useModelProvider,
  useToolProvider,
} from '../../providers';
import json from '../../../../manifest.json';
import { EXPORT_JSON_VERSION } from '../../../../constants';

export default function SettingsTab() {
  const { theme, logLevel, clearSettings, toggleSettings } = useSettings(
    ({ state, actions }) => ({
      theme: state.theme,
      logLevel: state.logLevel,
      clearSettings: actions.clearSettings,
      toggleSettings: actions.toggleSettings,
    })
  );

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const { userTools, chromeAPIBuiltInToolsState, builtInTools } =
    useToolProvider(({ state }) => ({
      userTools: state.userTools,
      chromeAPIBuiltInToolsState: state.chromeAPIBuiltInToolsState,
      builtInTools: state.builtInTools,
    }));

  const { serverConfigs } = useMcpProvider(({ state }) => ({
    serverConfigs: state.serverConfigs,
  }));

  const { apiKeys } = useModelProvider(({ state }) => ({
    apiKeys: state.apiKeys,
  }));

  const config = useCallback(async () => {
    const {
      promptCommands = [],
      builtInPromptCommands = [],
    }: {
      promptCommands: PromptCommand[];
      builtInPromptCommands: PromptCommand[];
    } = await chrome.storage.local.get([
      'promptCommands',
      'builtInPromptCommands',
    ]);

    return {
      config: {
        apiKeys,
        extensionSettings: {
          theme,
          logLevel,
        },
        userWebMCPTools: JSON.stringify(userTools, null, 2),
        mcpConfigs: JSON.stringify(serverConfigs, null, 2),
        chromeAPIBuiltInToolsState: chromeAPIBuiltInToolsState,
        promptCommands,
        builtInPromptCommands,
        builtInToolsState: builtInTools.reduce(
          (acc, tool) => {
            acc[tool.name] = tool.enabled;
            return acc;
          },
          {} as Record<string, boolean>
        ),
      },
      version: EXPORT_JSON_VERSION,
      extensionVersion: json.version,
      timestamp: Date.now(),
    };
  }, [userTools, logLevel, theme, apiKeys]);

  return (
    <OptionsPageTab
      title="Settings"
      description="Manage your extension settings, customize themes, and handle data storage options."
    >
      <ThemeSection toggleSettings={toggleSettings} theme={theme} />
      <SystemSection toggleSettings={toggleSettings} logLevel={logLevel} />
      <DataManagementSection
        settings={config}
        setIsResetModalOpen={setIsResetModalOpen}
      />
      {isResetModalOpen && (
        <ResetConfirmationDialog
          clearSettings={clearSettings}
          setIsResetModalOpen={setIsResetModalOpen}
        />
      )}
    </OptionsPageTab>
  );
}
