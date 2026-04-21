/**
 * External dependencies
 */
import { WebMCPToolsTab as WebMCPToolsUI } from '@google-awlt/design-system';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { listWorkflows, saveWorkflow } from '@google-awlt/engine-extension';
import type { WorkflowJSON } from '@google-awlt/engine-core';
/**
 * Internal Dependencies.
 */
import { useToolProvider } from '../../providers';
import { useSettings } from '../../../stateProviders';
import {
  type keys,
  mcpbTools,
} from '../../../../contentScript/tools/mcpbTools';
import { sanitizeToolName } from '../../../../serviceWorker/utils';

export function WebMCPToolsTab() {
  const [workflows, setWorkflows] = useState<WorkflowJSON[]>([]);

  useEffect(() => {
    const fetchWorkflows = async () => {
      const allWorkflows = await listWorkflows();
      setWorkflows(allWorkflows);
    };

    fetchWorkflows();
  }, []);

  const {
    userTools,
    builtInTools,
    saveUserTools,
    saveBuiltInState,
    chromeAPIBuiltInToolsState,
    saveExtensionToolsState,
  } = useToolProvider(({ state, actions }) => ({
    userTools: state.userTools,
    builtInTools: state.builtInTools,
    saveUserTools: actions.saveUserTools,
    saveBuiltInState: actions.saveBuiltInState,
    chromeAPIBuiltInToolsState: state.chromeAPIBuiltInToolsState,
    saveExtensionToolsState: actions.saveExtensionToolsState,
  }));

  const { isDarkMode } = useSettings(({ state }) => ({
    isDarkMode: state.isDarkMode,
  }));

  const mcpbBuiltInTools = useMemo(() => {
    return Object.keys(mcpbTools).map((toolkey) => {
      return {
        ...mcpbTools[toolkey as keys],
        enabled: chromeAPIBuiltInToolsState[toolkey]?.enabled,
      };
    });
  }, [chromeAPIBuiltInToolsState]);

  const workflowTools = useMemo(() => {
    return workflows
      .filter((wf) => wf.meta?.isWebMCP)
      .map((wf) => ({
        id: wf.meta.id,
        name: wf.meta.sanitizedName || sanitizeToolName(wf.meta.name),
        namespace: 'Workflow',
        description: wf.meta.description || '',
        allowedDomains: wf.meta.allowedDomains || [],
        inputSchema: {}, // Workflows might need this later
        enabled: wf.meta.enabled ?? true,
        isWorkflow: true,
      }));
  }, [workflows]);

  const handleSaveWorkflowState = useCallback(
    async (tool: any, enabled: boolean) => {
      const workflow = workflows.find((wf) => wf.meta.id === tool.id);

      if (workflow) {
        const updatedWorkflow = {
          ...workflow,
          meta: {
            ...workflow.meta,
            enabled,
          },
        };

        await saveWorkflow(tool.id, updatedWorkflow);
        setWorkflows((prev) =>
          prev.map((wf) => (wf.meta.id === tool.id ? updatedWorkflow : wf))
        );
      }
    },
    [workflows]
  );

  return (
    <WebMCPToolsUI
      userTools={userTools}
      builtInTools={builtInTools}
      workflowTools={workflowTools}
      mcpbTools={mcpbBuiltInTools}
      onSaveUserTools={saveUserTools}
      onSaveBuiltInState={saveBuiltInState}
      saveExtensionToolsState={saveExtensionToolsState}
      onSaveWorkflowState={handleSaveWorkflowState}
      isDarkMode={isDarkMode}
    />
  );
}
