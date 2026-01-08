/**
 * External dependencies.
 */
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
/**
 * Internal dependencies.
 */
import Context from './context';
import type { APIKeys } from '../../../../types';

const Provider = ({ children }: PropsWithChildren) => {
  const [apiKeys, setApiKeys] = useState<{ [key: string]: APIKeys }>({});
  const initialFetchDone = useRef<boolean>(false);

  const intitialSync = useCallback(async () => {
    const { apiKeys = {} }: { apiKeys: { [key: string]: APIKeys } } =
      await chrome.storage.sync.get('apiKeys');

    setApiKeys(apiKeys);
    initialFetchDone.current = true;
  }, []);

  const onSyncStorageChangedListener = useCallback(async () => {
    const { apiKeys = {} }: { apiKeys: { [key: string]: APIKeys } } =
      await chrome.storage.sync.get('apiKeys');

    setApiKeys(apiKeys);
  }, []);

  useEffect(() => {
    intitialSync();
    chrome.storage.sync.onChanged.addListener(onSyncStorageChangedListener);
    return () => {
      chrome.storage.sync.onChanged.removeListener(
        onSyncStorageChangedListener
      );
    };
  }, [intitialSync, onSyncStorageChangedListener]);

  const memoisedValue = useMemo(() => {
    return {
      state: {
        apiKeys,
      },
    };
  }, [apiKeys]);

  return <Context.Provider value={memoisedValue}>{children}</Context.Provider>;
};

export default Provider;
