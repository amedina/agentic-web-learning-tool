/**
 * External dependencies
 */
import {
  listWorkflows,
  loadWorkflow,
  handleRunWorkflow,
} from '@google-awlt/engine-extension';

/**
 * Internal dependencies
 */
import { isDomainAllowed } from '../../serviceWorker/utils';
import { logger } from '../../utils';

const WORKFLOW_MENU_ID = 'run-workflow-parent';
const WORKFLOW_ID_PREFIX = 'workflow-run-';

/**
 * Update the context menu with matching workflows for the current URL.
 * @param url - The current tab URL
 */
export const updateWorkflowsContextMenu = async (url?: string) => {
  if (typeof chrome === 'undefined' || !chrome.contextMenus) {
    return;
  }

  // Clear existing workflow menus
  await new Promise<void>((resolve) => {
    chrome.contextMenus.removeAll(() => resolve());
  });

  if (!url) {
    return;
  }

  try {
    const workflows = await listWorkflows();
    const matchingWorkflows = workflows.filter((wf) =>
      isDomainAllowed(url, wf.meta.allowedDomains)
    );

    if (matchingWorkflows.length === 0) {
      return;
    }

    // Create parent menu
    chrome.contextMenus.create({
      id: WORKFLOW_MENU_ID,
      title: 'Run Workflow',
      contexts: ['page', 'selection'],
    });

    // Create child menus for each workflow
    matchingWorkflows.forEach((wf) => {
      chrome.contextMenus.create({
        id: `${WORKFLOW_ID_PREFIX}${wf.meta.id}`,
        parentId: WORKFLOW_MENU_ID,
        title: wf.meta.name || 'Untitled Workflow',
        contexts: ['page', 'selection'],
      });
    });
  } catch (error) {
    logger(['error'], ['Failed to update workflows context menu:', error]);
  }
};

/**
 * Handle context menu item clicks.
 * @param info - Context menu click info
 * @param tab - The tab where the click occurred
 */
export const handleContextMenuClick = async (
  info: chrome.contextMenus.OnClickData,
  tab?: chrome.tabs.Tab
) => {
  const menuItemId = String(info.menuItemId);

  if (!menuItemId.startsWith(WORKFLOW_ID_PREFIX)) {
    return;
  }

  const workflowId = menuItemId.replace(WORKFLOW_ID_PREFIX, '');

  try {
    const workflow = await loadWorkflow(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return;
    }

    await handleRunWorkflow(workflow, tab?.id, {}, (response) => {
      logger(['debug'], ['Workflow response:', response]);

      if (!response.success) {
        throw new Error(response.error);
      }
    });
  } catch (error) {
    logger(['error'], [`Failed to execute workflow ${workflowId}:`, error]);
  }
};
