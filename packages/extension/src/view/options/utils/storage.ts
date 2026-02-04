/**
 * External dependencies
 */
import type { WorkflowJSON, WorkflowMeta } from '@google-awlt/engine-core';

export const STORAGE_PREFIX = 'workflow-';

/**
 * Save a workflow to local storage
 */
export const saveWorkflow = async (
  id: string,
  workflow: WorkflowJSON
): Promise<void> => {
  const key = `${STORAGE_PREFIX}${id}`;
  await chrome.storage.local.set({ [key]: workflow });
};

/**
 * Load a workflow from local storage
 */
export const loadWorkflow = async (
  id: string
): Promise<WorkflowJSON | null> => {
  const key = `${STORAGE_PREFIX}${id}`;
  const result = await chrome.storage.local.get(key);
  return (result?.[key] as WorkflowJSON) || null;
};

/**
 * List all saved workflows (metadata only)
 */
export const listWorkflows = async (): Promise<WorkflowMeta[]> => {
  const result = await chrome.storage.local.get(null);
  const workflows: WorkflowMeta[] = [];

  Object.keys(result).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const workflow = result[key] as WorkflowJSON;
      if (workflow.meta) {
        workflows.push(workflow.meta);
      }
    }
  });

  // Sort by savedAt descending (newest first)
  workflows.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  return workflows;
};

/**
 * Delete a workflow from local storage
 */
export const deleteWorkflow = async (id: string): Promise<void> => {
  const key = `${STORAGE_PREFIX}${id}`;
  await chrome.storage.local.remove(key);
};
