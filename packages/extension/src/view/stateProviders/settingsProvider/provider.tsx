/**
 * External dependencies
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import Logger, { type LogLevelDesc } from 'loglevel';
/**
 * Internal dependencies
 */
import type { LogLevel, SettingsState, ThemeMode } from '../../../types';
import SettingsContext, { type SettingsContextProps } from './context';
import { settingsGetter, settingsSetter } from '../../../utils/settingsGetter';

function SettingsProvider({
  children,
  view,
}: PropsWithChildren & { view: 'options' | 'sidepanel' | 'devtools' }) {
  const initialFetch = useRef(false);
  const [theme, setTheme] = useState<SettingsState['theme']>('auto');
  const [logLevel, setLogLevel] = useState<SettingsState['logLevel']>('SILENT');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  const fetchAndUpdateSettings = useCallback(async () => {
    const { theme: _theme, logLevel: _logLevel } = await settingsGetter();

    setTheme(_theme);
    setLogLevel(_logLevel);
  }, []);

  const clearSettings = useCallback(async () => {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    await chrome.storage.sync.clear();
    setTheme('auto');
    setLogLevel('SILENT');
  }, []);

  const syncStorageChangedListener = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!initialFetch.current || view === 'options') {
        return;
      }

      if (!changes.extensionSettings) {
        return;
      }

      fetchAndUpdateSettings();
    },
    [fetchAndUpdateSettings]
  );

  const handleChange = useCallback(() => {
    if (!window.matchMedia) {
      return;
    }

    const _isDarkMode = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;

    setIsDarkMode(_isDarkMode);
  }, []);

  useEffect(() => {
    if (theme === 'auto') {
      handleChange();

      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', handleChange);
    } else if (theme === 'dark') {
      setIsDarkMode(true);
    } else {
      setIsDarkMode(false);
    }

    return () => {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', handleChange);
    };
  }, [theme, handleChange]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    Logger.setLevel(logLevel.toLowerCase() as LogLevelDesc);
  }, [logLevel]);

  const toggleSettings = useCallback(
    (key: 'theme' | 'logLevel', value: ThemeMode | LogLevel) => {
      if (key === 'theme') {
        setTheme(value as ThemeMode);
      }

      if (key === 'logLevel') {
        setLogLevel(value as LogLevel);
      }

      settingsSetter(key, value);
    },
    []
  );

  useEffect(() => {
    (async () => {
      await fetchAndUpdateSettings();
      initialFetch.current = true;
    })();

    chrome.storage.sync.onChanged.addListener(syncStorageChangedListener);

    return () => {
      chrome.storage.sync.onChanged.removeListener(syncStorageChangedListener);
    };
  }, [fetchAndUpdateSettings, syncStorageChangedListener]);

  const contextValue = useMemo<SettingsContextProps>(
    () => ({
      state: {
        theme,
        logLevel,
        isDarkMode,
        workflowId,
      },
      actions: {
        clearSettings,
        toggleSettings,
        setWorkflowId,
      },
    }),
    [theme, logLevel, isDarkMode, workflowId, clearSettings, toggleSettings]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsProvider;
