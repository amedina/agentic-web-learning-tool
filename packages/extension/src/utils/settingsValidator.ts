/**
 * External dependencies
 */
import { logger } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import type { SettingsType } from '../types';

function settingsValidator(
  settings: SettingsType
): boolean | SettingsType['config'] {
  const { config } = settings;

  if (
    !config.apiKeys ||
    !config.extensionSettings ||
    !config.userWebMCPTools ||
    !config.builtInToolsState ||
    !config.chromeAPIBuiltInToolsState ||
    !config.mcpConfigs ||
    !config.promptCommands ||
    !config.builtInPromptCommands
  ) {
    logger(['error'], ['Invalid config non existent keys']);
    return false;
  }

  const isThemeConfigDefined =
    typeof config?.extensionSettings?.theme !== 'undefined';
  const isLogLevelDefined =
    typeof config?.extensionSettings?.logLevel !== 'undefined';
  const defaultConfig = { ...config.extensionSettings };
  if (!isLogLevelDefined) {
    logger(['warn'], ['Loglevel not defined defaulting to SILENT']);
    defaultConfig['logLevel'] = 'SILENT';
  }

  if (!isThemeConfigDefined) {
    logger(['warn'], ['Theme not defined defaulting to Auto']);
    defaultConfig['theme'] = 'auto';
  }

  return {
    userWebMCPTools: JSON.parse(config.userWebMCPTools),
    mcpConfigs: JSON.parse(config.mcpConfigs),
    apiKeys: config.apiKeys,
    chromeAPIBuiltInToolsState: config.chromeAPIBuiltInToolsState,
    builtInToolsState: config.builtInToolsState,
    extensionSettings: defaultConfig,
    builtInPromptCommands: config.builtInPromptCommands,
    promptCommands: config.promptCommands,
  };
}

export default settingsValidator;
