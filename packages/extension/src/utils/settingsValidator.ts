/**
 * External dependencies
 */
import type { WebMCPTool } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import type { APIKeys, LogLevel, ThemeMode } from '../types';
import logger from './logger';

type SettingsType = {
    config: {
        apiKeys?: Record<string, APIKeys>;
        extensionSettings?: {
            theme?: ThemeMode;
            logLevel?: LogLevel;
        };
        userWebMCPTools?: WebMCPTool[];
    };
    version: string;
    extensionVersion: string;
    timestamp: number;
};

function settingsValidator(settings: SettingsType): boolean | SettingsType['config'] {
    const { config } = settings;
    // Checkpoint 1: Check if it has all the keys
    if (
        !config.apiKeys ||
        !config.extensionSettings ||
        !config.userWebMCPTools
    ) {
        logger(['error'], ['Invalid config non existent keys']);
        return false;
    }

    const isThemeConfigDefined = typeof config?.extensionSettings?.theme !== 'undefined';
    const isLogLevelDefined = typeof config?.extensionSettings?.logLevel !== 'undefined';
    const defaultConfig = { ...config.extensionSettings };
    if (!isLogLevelDefined) {
        logger(['warn'], ['Loglevel not defined defaulting to SILENT']);
        defaultConfig['logLevel'] = 'SILENT';
    }

    if (!isThemeConfigDefined) {
        logger(['warn'], ['Theme not defined defaulting to Auto']);
        defaultConfig['theme'] = 'auto';
    }

    return { userWebMCPTools: config.userWebMCPTools, apiKeys: config.apiKeys, extensionSettings: defaultConfig};
}

export default settingsValidator;