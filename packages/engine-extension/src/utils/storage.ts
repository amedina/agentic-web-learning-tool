/**
 * External dependencies
 */
import type { WorkflowJSON } from '@google-awlt/engine-core';

export const STORAGE_PREFIX = 'workflow-composer';

export type WorkflowMetadata = WorkflowJSON['meta'];

/**
 * Save a workflow to local storage
 */
export const saveWorkflow = async (
  id: string,
  workflow: WorkflowJSON
): Promise<void> => {
  const prev = await chrome.storage.local.get(STORAGE_PREFIX);

  await chrome.storage.local.set({
    [STORAGE_PREFIX]: {
      ...(prev?.[STORAGE_PREFIX] || {}),
      [id]: workflow,
    },
  });
};

/**
 * Load a workflow from local storage
 */
export const loadWorkflow = async (
  id: string
): Promise<WorkflowJSON | null> => {
  const result = (await chrome.storage.local.get(STORAGE_PREFIX)) as {
    [STORAGE_PREFIX]: Record<string, WorkflowJSON>;
  };

  return result?.[STORAGE_PREFIX]?.[id] || null;
};

/**
 * List all saved workflows (metadata only)
 */
export const listWorkflows = async (): Promise<WorkflowJSON[]> => {
  const result = (await chrome.storage.local.get(STORAGE_PREFIX)) as {
    [STORAGE_PREFIX]: Record<string, WorkflowJSON>;
  };
  const workflows: WorkflowJSON[] = [];

  Object.keys(result?.[STORAGE_PREFIX] || {}).forEach((key) => {
    const workflow = result?.[STORAGE_PREFIX]?.[key] as
      | WorkflowJSON
      | undefined;

    if (workflow) {
      workflows.push(workflow);
    }
  });

  // Sort by savedAt descending (newest first)
  workflows.sort(
    (a, b) =>
      new Date(b.meta.savedAt).getTime() - new Date(a.meta.savedAt).getTime()
  );

  return workflows;
};

/**
 * Delete a workflow from local storage
 */
export const deleteWorkflow = async (id: string): Promise<void> => {
  const result = (await chrome.storage.local.get(STORAGE_PREFIX)) as {
    [STORAGE_PREFIX]: Record<string, WorkflowJSON>;
  };

  delete result?.[STORAGE_PREFIX]?.[id];
  await chrome.storage.local.set(result);
};

/**
 * Save the ID of the last opened workflow
 */
export const setLastOpenedWorkflowId = async (id: string): Promise<void> => {
  await chrome.storage.local.set({
    [`${STORAGE_PREFIX}-last-opened`]: id,
  });
};

/**
 * Get the ID of the last opened workflow
 */
export const getLastOpenedWorkflowId = async (): Promise<string | null> => {
  const key = `${STORAGE_PREFIX}-last-opened`;
  const result = await chrome.storage.local.get(key);
  const idValue = result[key];
  return typeof idValue === 'string' ? idValue : null;
};
