/**
 * External dependencies.
 */
import {
  type PropsWithChildren,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { WebMCPTool } from '@google-awlt/design-system';
/**
 * Internal dependencies.
 */
import Context from './context';
import { tools } from '../../../../contentScript/tools';
import {
  chromeApiBuiltInTools,
  type keys,
} from '../../../../contentScript/tools/builtInTools';

const builtInWebMCPTools: WebMCPTool[] = tools.map((tool) => ({
  name: tool.name,
  namespace: 'built_in',
  description: tool.description,
  allowedDomains: tool.allowedDomains,
  inputSchema: tool.inputSchema,
  enabled: true,
  isBuiltIn: true,
}));

const _chromeAPIBuiltInToolsState: { [key: string]: { enabled: boolean } } = {};

Object.keys(chromeApiBuiltInTools).forEach(
  (toolKey) =>
    (_chromeAPIBuiltInToolsState[toolKey] = {
      enabled: true,
    })
);

const Provider = ({ children }: PropsWithChildren) => {
  const [userTools, setUserTools] = useState<WebMCPTool[]>([]);
  const [builtInTools, setBuiltInTools] =
    useState<WebMCPTool[]>(builtInWebMCPTools);
  const [chromeAPIBuiltInToolsState, setChromeAPIBuiltInToolsState] = useState(
    _chromeAPIBuiltInToolsState
  );
  const initialFetchDone = useRef(false);

  const intitialSync = useCallback(async () => {
    const {
      userWebMCPTools = [],
      builtInWebMCPToolsState = {},
      chromeAPIBuiltInToolsState = {},
    }: {
      userWebMCPTools: WebMCPTool[];
      builtInWebMCPToolsState: Record<string, boolean>;
      chromeAPIBuiltInToolsState: {
        [key: string]: {
          enabled: boolean;
        };
      };
    } = await chrome.storage.local.get([
      'userWebMCPTools',
      'builtInWebMCPToolsState',
      'chromeAPIBuiltInToolsState',
    ]);

    if (userWebMCPTools && Array.isArray(userWebMCPTools)) {
      setUserTools(userWebMCPTools as WebMCPTool[]);
    }

    if (Object.keys(chromeAPIBuiltInToolsState).length > 1) {
      setChromeAPIBuiltInToolsState(chromeAPIBuiltInToolsState);
    }

    if (builtInWebMCPToolsState) {
      const states = builtInWebMCPToolsState;
      setBuiltInTools((prev) =>
        prev.map((t) => ({
          ...t,
          enabled: states[t.name] !== undefined ? states[t.name] : true,
        }))
      );
    }

    initialFetchDone.current = true;
  }, []);

  const onLocalStorageChangedListener = useCallback(async () => {
    const {
      userWebMCPTools = [],
      builtInWebMCPToolsState = {},
      chromeAPIBuiltInToolsState = {},
    }: {
      userWebMCPTools: WebMCPTool[];
      builtInWebMCPToolsState: Record<string, boolean>;
      chromeAPIBuiltInToolsState: {
        [key: string]: {
          enabled: boolean;
        };
      };
    } = await chrome.storage.local.get([
      'userWebMCPTools',
      'builtInWebMCPToolsState',
      'chromeAPIBuiltInToolsState',
    ]);

    setUserTools(userWebMCPTools);
    const states = builtInWebMCPToolsState;
    setBuiltInTools((prev) =>
      prev.map((t) => ({
        ...t,
        enabled: states[t.name] !== undefined ? states[t.name] : true,
      }))
    );
    setChromeAPIBuiltInToolsState(chromeAPIBuiltInToolsState);
  }, []);

  useEffect(() => {
    intitialSync();
    chrome.storage.local.onChanged.addListener(onLocalStorageChangedListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(
        onLocalStorageChangedListener
      );
    };
  }, [intitialSync, onLocalStorageChangedListener]);

  const saveUserTools = useCallback((tools: WebMCPTool[]) => {
    setUserTools(tools);
    chrome.storage.local.set({ userWebMCPTools: tools });
  }, []);

  const saveExtensionToolsState = useCallback(
    (toolName: string, value: boolean) => {
      setChromeAPIBuiltInToolsState((prev) => {
        const newValue = structuredClone(prev);
        const keyToChange = Object.keys(chromeApiBuiltInTools).filter(
          (key) => chromeApiBuiltInTools[key as keys].name === toolName
        );
        newValue[keyToChange[0]].enabled = value;
        chrome.storage.local.set({ chromeAPIBuiltInToolsState: newValue });
        return newValue;
      });
    },
    []
  );

  const saveBuiltInState = useCallback((tools: WebMCPTool[]) => {
    setBuiltInTools(tools);
    const states = tools.reduce<Record<string, boolean>>(
      (acc, t) => ({ ...acc, [t.name]: t.enabled }),
      {}
    );
    chrome.storage.local.set({ builtInWebMCPToolsState: states });
  }, []);

  const memoisedValue = useMemo(() => {
    return {
      state: {
        userTools,
        builtInTools,
        chromeAPIBuiltInToolsState,
      },
      actions: {
        setUserTools,
        setBuiltInTools,
        saveUserTools,
        saveBuiltInState,
        saveExtensionToolsState,
      },
    };
  }, [
    builtInTools,
    userTools,
    chromeAPIBuiltInToolsState,
    saveBuiltInState,
    saveUserTools,
    saveExtensionToolsState,
  ]);

  return <Context.Provider value={memoisedValue}>{children}</Context.Provider>;
};

export default Provider;
