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
import { MESSAGE_TYPES } from '../../../utils';

function SettingsProvider({
  children,
  view,
}: PropsWithChildren & { view: 'options' | 'sidepanel' | 'devtools' }) {
  const initialFetch = useRef(false);
  const [theme, setTheme] = useState<SettingsState['theme']>('auto');
  const [logLevel, setLogLevel] = useState<SettingsState['logLevel']>('SILENT');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [tabData, setTabData] = useState<{
    [key: string]: chrome.tabs.Tab;
  }>({});
  const [lockedThreads, setLockedThreads] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);

  const fetchTabData = useCallback(async () => {
    const tabs = await chrome.tabs.query({});
    const _currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    setCurrentTab(_currentTab[0]);
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

  const handleMessage = useCallback(
    (message: any) => {
      if (
        message.type === MESSAGE_TYPES.CLOSE_SIDEPANEL &&
        view === 'sidepanel' &&
        currentTab &&
        message.payload.tabId === currentTab?.id
      ) {
        chrome.storage.session.set({
          [`sidebar_tab_${currentTab?.id}`]: {
            tabId: currentTab?.id,
            isOpen: false,
            timestamp: Date.now(),
          },
        });
        window.close();
      }
    },
    [currentTab, view]
  );

  const sessionStorageListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!changes['lockedThreads']?.newValue) {
        return;
      }

      const updatedLockedThreads = changes['lockedThreads']
        .newValue as string[];
      setLockedThreads(updatedLockedThreads);
    },
    []
  );

  const fetchAndUpdateSettings = useCallback(async () => {
    const { theme: _theme, logLevel: _logLevel } = await settingsGetter();
    const { lockedThreads: _lockedThreads }: { lockedThreads: string[] } =
      await chrome.storage.session.get('lockedThreads');

    setLockedThreads(_lockedThreads || []);
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

  useEffect(() => {
    (async () => {
      await fetchAndUpdateSettings();
      await fetchTabData();
      initialFetch.current = true;
    })();
    chrome.runtime.onMessage.addListener(handleMessage);
    chrome.storage.sync.onChanged.addListener(syncStorageChangedListener);
    chrome.tabs.onCreated.addListener(addTabData);
    chrome.storage.session.onChanged.addListener(sessionStorageListener);
    chrome.webNavigation.onCommitted.addListener(updateTabsData);
    return () => {
      chrome.storage.sync.onChanged.removeListener(syncStorageChangedListener);
      chrome.webNavigation.onCommitted.removeListener(updateTabsData);
      chrome.tabs.onCreated.removeListener(addTabData);
      chrome.storage.session.onChanged.removeListener(sessionStorageListener);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [
    handleMessage,
    fetchTabData,
    sessionStorageListener,
    addTabData,
    fetchAndUpdateSettings,
    syncStorageChangedListener,
    updateTabsData,
  ]);

  const contextValue = useMemo<SettingsContextProps>(
    () => ({
      state: {
        theme,
        logLevel,
        isDarkMode,
        workflowId,
        tabData,
        lockedThreads,
      },
      actions: {
        clearSettings,
        toggleSettings,
        setWorkflowId,
      },
    }),
    [
      lockedThreads,
      tabData,
      theme,
      logLevel,
      isDarkMode,
      workflowId,
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
