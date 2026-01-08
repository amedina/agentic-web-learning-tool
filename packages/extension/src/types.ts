/**
 * External dependencies
 */
import type { WebMCPTool } from '@google-awlt/design-system';
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
    userWebMCPTools?: WebMCPTool[];
  };
  version: string;
  extensionVersion: string;
  timestamp: number;
};
