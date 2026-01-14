/**
 * Internal dependencies
 */
import type { LOG_OPTS } from './utils/constants';

export type LogLevel = (typeof LOG_OPTS)[number]['id'];
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface SettingsState {
  logLevel: LogLevel;
  theme: ThemeMode;
}
export type AgentType = {
  model: string;
  modelProvider: string;
};

export type APIKeys = {
  apiKey: string;
  thinkingMode?: boolean;
  status: boolean;
};

export type SettingsType = {
  config: {
    apiKeys?: Record<string, APIKeys>;
    extensionSettings?: {
      theme?: ThemeMode;
      logLevel?: LogLevel;
    };
    userWebMCPTools?: string;
    mcpConfigs?: string;
    builtInToolsState?: Record<string, boolean>;
    chromeAPIBuiltInToolsState?: {
      [key: string]: {
        enabled: boolean;
      };
    };
  };
  version: string;
  extensionVersion: string;
  timestamp: number;
};
