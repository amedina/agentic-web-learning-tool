/**
 * External dependencies
 */
import { type WorkflowJSON } from '@google-awlt/engine-core';
/**
 * Internal dependencies
 */
import { initContentScriptBridge } from '../contentScript';
import {
  type ServiceWorkerMessage,
  type WorkflowResponse,
  type CapabilitiesResponse,
} from '../types/messages';
import { getWorkflowRunner } from './runner';
import {
  getWorkflowStateManager,
  type GlobalWorkflowState,
} from './stateManager';

/**
 * Service Worker Bridge
 *
 * Handles messages from the UI/Options page and coordinates workflow execution.
 */
function handleMessage(
  message: ServiceWorkerMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (
    response:
      | WorkflowResponse
      | CapabilitiesResponse
      | { success: boolean; state?: GlobalWorkflowState }
  ) => void
): boolean {
  switch (message.type) {
    case 'RUN_WORKFLOW':
      handleRunWorkflow(message.workflow, message.tabId, sender, sendResponse);
      return true;

    case 'CHECK_CAPABILITIES':
      handleCheckCapabilities(message.capabilities, sendResponse);
      return true;

    case 'STOP_WORKFLOW':
      handleStopWorkflow(sendResponse);
      return true;

    case 'GET_GLOBAL_STATUS':
      handleGetGlobalStatus(sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      return false;
  }
}

/**
 * Handle workflow execution request.
 */
export async function handleRunWorkflow(
  workflow: WorkflowJSON,
  tabId: number | undefined,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: WorkflowResponse) => void
) {
  const runner = getWorkflowRunner();
  const stateManager = getWorkflowStateManager();
  const targetTabId = tabId ?? sender?.tab?.id;

  if (stateManager.isBusy()) {
    sendResponse({
      success: false,
      error:
        'A workflow is already in progress. Please wait for it to finish or stop it first.',
    });
    return;
  }

  try {
    if (targetTabId) {
      console.log(
        `[Workflow] Injecting content script into tab ${targetTabId}`
      );

      // Try-catch to handle cases where content script is not active
      try {
        const response = await chrome.tabs.sendMessage(targetTabId, {
          type: 'CONTENT_SCRIPT_ACTIVE',
          targetTabId,
        });

        if (chrome.runtime.lastError) {
          throw new Error('No Content Script!');
        }

        if (!response || !response?.success) {
          throw new Error('No Content Script!');
        }
      } catch {
        await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          func: initContentScriptBridge,
          injectImmediately: true,
        });
      }
    }

    // Initialize state
    await stateManager.initWorkflow(
      workflow.meta.id,
      workflow.meta.name,
      targetTabId
    );

    const context = await runner.run(workflow, targetTabId, {
      onNodeStart: (nodeId) => {
        stateManager.updateNodeStatus(nodeId, 'running');
      },
      onNodeFinish: (nodeId, output) => {
        stateManager.updateNodeStatus(nodeId, output.status as any, output);
      },
      onError: (error) => {
        stateManager.finishWorkflow(false, { error: error.message });
      },
    });

    await stateManager.finishWorkflow(true, context);

    sendResponse({ success: true, context });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stateManager.finishWorkflow(false, { error: message });
    sendResponse({ success: false, error: message });
  }
}

/**
 * Handle stop workflow request.
 */
async function handleStopWorkflow(sendResponse: (response: any) => void) {
  getWorkflowRunner().stop();
  await getWorkflowStateManager().reset();
  sendResponse({ success: true });
}

/**
 * Handle capability check request.
 */
async function handleCheckCapabilities(
  capabilities: string[] | Record<string, any>,
  sendResponse: (response: CapabilitiesResponse) => void
) {
  const runner = getWorkflowRunner();

  try {
    const results = await runner.checkCapabilities(capabilities);
    sendResponse({ success: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, error: message });
  }
}

/**
 * Handle global status request.
 */
function handleGetGlobalStatus(sendResponse: (response: any) => void) {
  const state = getWorkflowStateManager().getState();
  sendResponse({ success: true, state });
}

/**
 * Initialize the service worker bridge.
 */
export function initServiceWorkerBridge(): void {
  chrome.runtime.onMessage.addListener(handleMessage);
  console.log('[Workflow] Service worker bridge initialized');
}
