/**
 * External dependencies.
 */
import { useEffect, useCallback, useState } from 'react';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Internal dependencies.
 */
import { getToolCategory } from '../../../utils';
import { sanitizeToolName } from '../../../serviceWorker/utils';

interface WorkflowComposerData {
  graph: {};
  meta: {
    name: string;
    isWebMCP?: boolean;
  };
}
interface StorageData {
  userWebMCPTools: Tool[];
  'workflow-composer': Record<string, WorkflowComposerData>;
}

/**
 * Get tool category mapping for tools.
 *
 * User tools -- localStorage
 * Workflow tools -- localStorage
 * Built-in tools -- Constant variable
 * MCP tools -- suffix
 * mcp-b tools -- prefix
 * WebSite tools -- nothing
 *
 * @param tools
 * @returns mapping of tool name to tool category
 */
const useToolCategoryMapping = (tools: Tool[]) => {
  const [userTools, setUserTools] = useState<string[] | null>(null);
  const [workflowTools, setWorkflowTools] = useState<string[] | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const createMappingFromStorage = useCallback(async () => {
    const {
      userWebMCPTools,
      'workflow-composer': workflowWebMCPTools,
    }: StorageData = await chrome.storage.local.get([
      'userWebMCPTools',
      'workflow-composer',
    ]);

    if (userWebMCPTools && userWebMCPTools.length > 0) {
      setUserTools(userWebMCPTools.map((tool) => tool.name));
    } else {
      setUserTools([]);
    }

    if (workflowWebMCPTools && Object.keys(workflowWebMCPTools).length > 0) {
      setWorkflowTools(
        Object.keys(workflowWebMCPTools)
          .map((key) =>
            workflowWebMCPTools[key].meta.isWebMCP
              ? sanitizeToolName(workflowWebMCPTools[key].meta.name)
              : ''
          )
          .filter((toolName) => toolName !== '')
      );
    } else {
      setWorkflowTools([]);
    }
  }, [setUserTools, setWorkflowTools]);

  const onLocalStorageChange = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.userWebMCPTools || changes['workflow-composer']) {
        createMappingFromStorage();
      }
    },
    [createMappingFromStorage]
  );

  useEffect(() => {
    createMappingFromStorage();

    chrome.storage.local.onChanged.addListener(onLocalStorageChange);

    return () => {
      chrome.storage.local.onChanged.removeListener(onLocalStorageChange);
    };
  }, [createMappingFromStorage, onLocalStorageChange]);

  useEffect(() => {
    // We want to wait for userTools and workflowTools to be set.
    if (!userTools || !workflowTools) {
      return;
    }

    tools.forEach((tool) => {
      setMapping((prevMapping) => ({
        ...prevMapping,
        [tool.name]: getToolCategory(tool.name, userTools, workflowTools),
      }));
    });
  }, [tools, userTools, workflowTools]);

  return mapping;
};

export default useToolCategoryMapping;
