export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SILENT';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface SettingsState {
    logLevel: LogLevel;
    theme: ThemeMode;
}