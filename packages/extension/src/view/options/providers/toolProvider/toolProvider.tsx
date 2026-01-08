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
import { builtInTools as builtInExtensionTools } from '../../../../contentScript/tools/builtInTools';

const builtInWebMCPTools: WebMCPTool[] = tools.map((tool) => ({
  name: tool.name,
  namespace: 'built_in',
  description: tool.description,
  allowedDomains: tool.allowedDomains,
  inputSchema: tool.inputSchema,
  enabled: true,
  isBuiltIn: true,
}));

const extensionToolsState: { [key: string]: { enabled: boolean } } = {};

Object.keys(builtInExtensionTools).forEach(
  (toolKey) =>
    (extensionToolsState[toolKey] = {
      enabled: true,
    })
);

const Provider = ({ children }: PropsWithChildren) => {
  const [userTools, setUserTools] = useState<WebMCPTool[]>([]);
  const [builtInTools, setBuiltInTools] =
    useState<WebMCPTool[]>(builtInWebMCPTools);
  const [extensionTools, setExtensionTools] = useState(extensionToolsState);
  const initialFetchDone = useRef(false);

  const intitialSync = useCallback(async () => {
    const {
      userWebMCPTools = [],
      builtInWebMCPToolsState = {},
    }: {
      userWebMCPTools: WebMCPTool[];
      builtInWebMCPToolsState: Record<string, boolean>;
    } = await chrome.storage.local.get([
      'userWebMCPTools',
      'builtInWebMCPToolsState',
    ]);

    if (userWebMCPTools && Array.isArray(userWebMCPTools)) {
      setUserTools(userWebMCPTools as WebMCPTool[]);
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
      extensionToolsState = {},
    }: {
      userWebMCPTools: WebMCPTool[];
      builtInWebMCPToolsState: Record<string, boolean>;
      extensionToolsState: {
        [key: string]: {
          enabled: boolean;
        };
      };
    } = await chrome.storage.local.get([
      'userWebMCPTools',
      'builtInWebMCPToolsState',
      'extensionToolsState',
    ]);

    setUserTools(userWebMCPTools);
    const states = builtInWebMCPToolsState;
    setBuiltInTools((prev) =>
      prev.map((t) => ({
        ...t,
        enabled: states[t.name] !== undefined ? states[t.name] : true,
      }))
    );
    setExtensionTools(extensionToolsState);
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
      setExtensionTools((prev) => {
        const newValue = structuredClone(prev);
        newValue[toolName].enabled = value;
        chrome.storage.local.set({ extensionTools: newValue });
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
        extensionTools,
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
    extensionTools,
    saveBuiltInState,
    saveUserTools,
    saveExtensionToolsState,
  ]);

  return <Context.Provider value={memoisedValue}>{children}</Context.Provider>;
};

export default Provider;
