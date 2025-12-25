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