/**
 * Internal dependencies
 */
import type { LOG_OPTS } from "./utils/constants";

export type LogLevel = typeof LOG_OPTS[number]['id'];
export type ThemeMode = 'light' | 'dark' | 'auto';

export interface SettingsState {
    logLevel: LogLevel;
    theme: ThemeMode;
}
export type AgentType = {
	model: string;
	modelProvider: string;
};

export type APIKeys ={
    apiKey: string;
    thinkingMode?: boolean;
    status: boolean;
}
