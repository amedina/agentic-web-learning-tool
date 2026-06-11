/**
 * External dependencies.
 */
import {
  useCallback,
  useEffect,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react';

const useContextInvalidated = (
  contextInvalidatedRef: RefObject<boolean | null>,
  contextInvalidated: boolean,
  setContextInvalidated: Dispatch<SetStateAction<boolean>>
): boolean => {
  const listenToMouseChange = useCallback(() => {
    if (contextInvalidatedRef.current) {
      if (!chrome.runtime?.id) {
        setContextInvalidated(true);
        localStorage.setItem('contextInvalidated', 'true');
      }
    }
  }, [setContextInvalidated, contextInvalidatedRef]);

  useEffect(() => {
    window.addEventListener('mouseover', listenToMouseChange);

    return () => {
      window.removeEventListener('mouseover', listenToMouseChange);
    };
  }, [listenToMouseChange]);

  useEffect(() => {
    (async () => {
      const localStorageFlag = localStorage.getItem('contextInvalidated');

      if (localStorageFlag && localStorageFlag === 'true') {
        const tabId = chrome.devtools.inspectedWindow.tabId;

        if (tabId) {
          chrome.tabs.reload(Number(tabId));
        }
        localStorage.removeItem('contextInvalidated');
      }
    })();
  }, []);

  return contextInvalidated;
};

export default useContextInvalidated;
