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
  const [tabData, setTabData] = useState<{
    [key: string]: chrome.tabs.Tab;
  }>({});
  const [currentTab, setCurrentTab] = useState<number>(0);

  const fetchTabData = useCallback(async () => {
    const tabs = await chrome.tabs.query({});
    setTabData(
      tabs.reduce(
        (acc, tab) => {
          if (!tab.id) {
            return acc;
          }

          acc[tab.id.toString()] = tab;
          return acc;
        },
        {} as {
          [key: string]: chrome.tabs.Tab;
        }
      )
    );
  }, []);

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
    [fetchAndUpdateSettings, view]
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

  const addTabData = useCallback((tabData: chrome.tabs.Tab) => {
    setTabData((prev) => {
      if (!tabData.id) {
        return prev;
      }

      const newData = structuredClone(prev);
      newData[tabData.id.toString()] = tabData;

      return newData;
    });
  }, []);

  const updateTabsData = useCallback(
    (tabData: chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {
      if (tabData.frameId !== 0) {
        return;
      }

      setTabData((prev) => {
        const newData = structuredClone(prev);

        if (newData[tabData.tabId]) {
          newData[tabData.tabId.toString()] = {
            ...newData[tabData.tabId],
            url: tabData.url,
          };
        }

        return newData;
      });
    },
    []
  );

  const onActivatedListener = useCallback(
    (tab: chrome.tabs.OnActivatedInfo) => {
      setCurrentTab(tab.tabId);
    },
    []
  );

  useEffect(() => {
    (async () => {
      await fetchAndUpdateSettings();
      await fetchTabData();
      initialFetch.current = true;
    })();

    chrome.storage.sync.onChanged.addListener(syncStorageChangedListener);
    chrome.tabs.onCreated.addListener(addTabData);
    chrome.webNavigation.onCommitted.addListener(updateTabsData);
    chrome.tabs.onActivated.addListener(onActivatedListener);
    return () => {
      chrome.storage.sync.onChanged.removeListener(syncStorageChangedListener);
      chrome.webNavigation.onCommitted.removeListener(updateTabsData);
      chrome.tabs.onCreated.removeListener(addTabData);
      chrome.tabs.onActivated.removeListener(onActivatedListener);
    };
  }, [
    onActivatedListener,
    addTabData,
    fetchAndUpdateSettings,
    fetchTabData,
    syncStorageChangedListener,
    updateTabsData,
  ]);

  const contextValue = useMemo<SettingsContextProps>(
    () => ({
      state: {
        theme,
        logLevel,
        isDarkMode,
        tabData,
        currentTab,
      },
      actions: {
        clearSettings,
        toggleSettings,
      },
    }),
    [
      currentTab,
      tabData,
      theme,
      logLevel,
      isDarkMode,
      clearSettings,
      toggleSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export default SettingsProvider;
