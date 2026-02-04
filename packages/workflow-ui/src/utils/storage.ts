/**
 * External dependencies
 */
import type { WorkflowJSON } from "@google-awlt/engine-core";

export const STORAGE_PREFIX = "workflow-";

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  savedAt: string;
}

/**
 * Save a workflow to local storage
 */
export const saveWorkflow = async (
  id: string,
  workflow: WorkflowJSON,
): Promise<void> => {
  const key = `${STORAGE_PREFIX}${id}`;
  await chrome.storage.local.set({ [key]: workflow });
};

/**
 * Load a workflow from local storage
 */
export const loadWorkflow = async (
  id: string,
): Promise<WorkflowJSON | null> => {
  const key = `${STORAGE_PREFIX}${id}`;
  const result = await chrome.storage.local.get(key);
  return (result[key] as WorkflowJSON) || null;
};

/**
 * List all saved workflows (metadata only)
 */
export const listWorkflows = async (): Promise<WorkflowMetadata[]> => {
  const result = await chrome.storage.local.get(null);
  const workflows: WorkflowMetadata[] = [];

  Object.keys(result).forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const workflow = result[key] as WorkflowJSON;
      if (workflow.meta) {
        workflows.push({
          id: workflow.meta.id,
          name: workflow.meta.name,
          description: workflow.meta.description,
          version: workflow.meta.version,
          savedAt: workflow.meta.savedAt || new Date().toISOString(),
        });
      }
    }
  });

  // Sort by savedAt descending (newest first)
  workflows.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
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
