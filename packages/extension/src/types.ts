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
	id: string;
	name: string;
	apiKey: string;
	providerUrl: string;
	temperature: number;
	maxTokens: number;
	thinkingMode: boolean;
	extraConfig: string;
	status: boolean;
	model: string;
	modelProvider: string;
	reasoningEffort?: string;
	reasoningSummary?: string;
}