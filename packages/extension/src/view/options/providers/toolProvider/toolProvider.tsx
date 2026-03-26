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
import { toast, type WebMCPTool } from '@google-awlt/design-system';
/**
 * Internal dependencies.
 */
import Context from './context';
import { builtInTools } from '../../../../contentScript/tools';
import {
  mcpbTools,
  type keys,
} from '../../../../contentScript/tools/mcpbTools';

const builtInWebMCPTools: WebMCPTool[] = builtInTools.map((tool) => ({
  name: tool.name,
  namespace: 'built_in',
  description: tool.description,
  allowedDomains: tool.allowedDomains,
  inputSchema: tool.inputSchema,
  enabled: true,
  isBuiltIn: true,
}));

const _chromeAPIBuiltInToolsState: { [key: string]: { enabled: boolean } } = {};

Object.keys(mcpbTools).forEach(
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

  const onLocalStorageChangedListener = useCallback(
    async (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (
        !changes?.userWebMCPTools &&
        !changes?.builtInWebMCPToolsState &&
        !changes?.chromeAPIBuiltInToolsState
      ) {
        return;
      }

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
    },
    []
  );

  useEffect(() => {
    intitialSync();
    chrome.storage.local.onChanged.addListener(onLocalStorageChangedListener);

    return () => {
      chrome.storage.local.onChanged.removeListener(
        onLocalStorageChangedListener
      );
    };
  }, [intitialSync, onLocalStorageChangedListener]);

  const saveUserTools = useCallback(
    async (tools: WebMCPTool[], editedTool?: WebMCPTool) => {
      setUserTools(tools);
      let hadBreakpointAttached = false;
      const { userWebMCPTools }: { userWebMCPTools: WebMCPTool[] } =
        await chrome.storage.local.get('userWebMCPTools');

      const updatedTools = tools.map((tool) => {
        const storedTool = userWebMCPTools.find(
          (tool) => tool.name === editedTool?.name
        );
        if (
          tool.name === storedTool?.name &&
          storedTool?.editedScript?.tabId &&
          storedTool?.editedScript?.tabId.length > 0
        ) {
          hadBreakpointAttached = true;
        }
        return tool;
      });

      if (hadBreakpointAttached) {
        toast.info('Breakpoint removed from tool.', {
          duration: 2000,
          dismissible: true,
        });
      }

      chrome.storage.local.set({ userWebMCPTools: updatedTools });
    },
    []
  );

  const saveExtensionToolsState = useCallback(
    (toolName: string, value: boolean) => {
      setChromeAPIBuiltInToolsState((prev) => {
        const newValue = structuredClone(prev);
        const keyToChange = Object.keys(mcpbTools).filter(
          (key) => mcpbTools[key as keys].name === toolName
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
