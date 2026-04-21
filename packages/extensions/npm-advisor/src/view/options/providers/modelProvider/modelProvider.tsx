/**
 * External dependencies
 */
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";

/**
 * Internal dependencies
 */
import Context from "./context";
import type { APIKeys } from "../../../../types";

const ModelProvider = ({ children }: PropsWithChildren) => {
  const [apiKeys, setApiKeys] = useState<{ [key: string]: APIKeys }>({});
  const initialFetchDone = useRef<boolean>(false);

  const initialSync = useCallback(async () => {
    const { apiKeys = {} }: { apiKeys: { [key: string]: APIKeys } } =
      await chrome.storage.sync.get("apiKeys");
    setApiKeys(apiKeys);
    initialFetchDone.current = true;
  }, []);

  const onSyncStorageChangedListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (!changes.apiKeys) {
        return;
      }
      const { apiKeys = {} }: { apiKeys: { [key: string]: APIKeys } } =
        await chrome.storage.sync.get("apiKeys");
      setApiKeys(apiKeys);
    },
    [],
  );

  useEffect(() => {
    initialSync();
    chrome.storage.sync.onChanged.addListener(onSyncStorageChangedListener);
    return () => {
      chrome.storage.sync.onChanged.removeListener(
        onSyncStorageChangedListener,
      );
    };
  }, [initialSync, onSyncStorageChangedListener]);

  const memoizedValue = useMemo(() => ({ state: { apiKeys } }), [apiKeys]);

  return <Context.Provider value={memoizedValue}>{children}</Context.Provider>;
};

export default ModelProvider;
