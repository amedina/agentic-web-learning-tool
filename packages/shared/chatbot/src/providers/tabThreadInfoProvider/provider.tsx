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
/**
 * Internal dependencies
 */
import TabThreadContext, { type TabThreadContextProps } from './context';

function TabThreadInformationProvider({ children }: PropsWithChildren) {
  const initialFetch = useRef(false);
  const [tabData, setTabData] = useState<{
    [key: string]: chrome.tabs.Tab;
  }>({});
  const [lockedThreads, setLockedThreads] = useState<string[]>([]);

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
    const { lockedThreads: _lockedThreads }: { lockedThreads: string[] } =
      await chrome.storage.session.get('lockedThreads');

    setLockedThreads(_lockedThreads || []);
  }, []);

  const syncStorageChangedListener = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!initialFetch.current) {
        return;
      }

      if (!changes.extensionSettings) {
        return;
      }

      fetchAndUpdateSettings();
    },
    [fetchAndUpdateSettings]
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
    chrome.storage.sync.onChanged.addListener(syncStorageChangedListener);
    chrome.tabs.onCreated.addListener(addTabData);
    chrome.storage.session.onChanged.addListener(sessionStorageListener);
    chrome.webNavigation.onCommitted.addListener(updateTabsData);
    return () => {
      chrome.storage.sync.onChanged.removeListener(syncStorageChangedListener);
      chrome.webNavigation.onCommitted.removeListener(updateTabsData);
      chrome.tabs.onCreated.removeListener(addTabData);
      chrome.storage.session.onChanged.removeListener(sessionStorageListener);
    };
  }, [
    sessionStorageListener,
    addTabData,
    syncStorageChangedListener,
    updateTabsData,
  ]);

  useEffect(() => {
    (async () => {
      if (initialFetch.current) {
        return;
      }
      await fetchAndUpdateSettings();
      await fetchTabData();
      initialFetch.current = true;
    })();
  }, [fetchTabData, fetchAndUpdateSettings]);

  const contextValue = useMemo<TabThreadContextProps>(
    () => ({
      state: {
        tabData,
        lockedThreads,
      },
      actions: {},
    }),
    [lockedThreads, tabData]
  );

  return (
    <TabThreadContext.Provider value={contextValue}>
      {children}
    </TabThreadContext.Provider>
  );
}

export default TabThreadInformationProvider;
