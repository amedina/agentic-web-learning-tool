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
  sendResponseCb: (
    response:
      | WorkflowResponse
      | CapabilitiesResponse
      | { success: boolean; state?: GlobalWorkflowState }
  ) => void
) {
  const sendResponse = (
    response:
      | WorkflowResponse
      | CapabilitiesResponse
      | { success: boolean; state?: GlobalWorkflowState }
  ) => {
    try {
      sendResponseCb(response);
    } catch (error) {
      console.error('[Workflow] Failed to send response:', error);
    }
  };

  switch (message.type) {
    case 'RUN_WORKFLOW':
      return handleRunWorkflow(
        message.workflow,
        message.tabId,
        sender,
        sendResponse
      );

    case 'CHECK_CAPABILITIES':
      handleCheckCapabilities(message.capabilities, sendResponse);
      return true;

    case 'STOP_WORKFLOW':
      handleStopWorkflow(sendResponse);
      return true;

    case 'GET_GLOBAL_STATUS':
      handleGetGlobalStatus(sendResponse);
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      break;
  }
}

/**
 * Handle workflow execution request.
 */
export function handleRunWorkflow(
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

  const prepareContentScript = async () => {
    if (!targetTabId) return Promise.resolve();

    console.log(`[Workflow] Injecting content script into tab ${targetTabId}`);

    // Try-catch to handle cases where content script is not active
    try {
      const response = await chrome.tabs.sendMessage(targetTabId, {
        type: 'CONTENT_SCRIPT_ACTIVE',
        targetTabId,
      });

      if (!response || !response?.success) {
        throw new Error('No Content Script!');
      }
    } catch {
      return chrome.scripting.executeScript({
        target: { tabId: targetTabId! },
        func: initContentScriptBridge,
        injectImmediately: true,
        args: [targetTabId],
      });
    }
  };

  prepareContentScript()
    .then((res) =>
      stateManager.initWorkflow(
        workflow.meta.id,
        workflow.meta.name,
        targetTabId
      )
    )
    .then(() =>
      runner.run(workflow, targetTabId, {
        onNodeStart: (nodeId) => {
          stateManager.updateNodeStatus(nodeId, 'running');
        },
        onNodeFinish: (nodeId, output) => {
          stateManager.updateNodeStatus(nodeId, output.status as any, output);
        },
        onError: (error) => {
          stateManager.finishWorkflow(false, { error: error.message });
        },
      })
    )
    .then((context) => {
      stateManager.finishWorkflow(true, context);
      return context;
    })
    .then((context) => {
      sendResponse({ success: true, context });
      console.log('[Workflow] Workflow completed successfully');
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      stateManager.finishWorkflow(false, { error: message });
      sendResponse({ success: false, error: message });
    });

  return true;
}

/**
 * Handle stop workflow request.
 */
function handleStopWorkflow(sendResponse: (response: any) => void) {
  getWorkflowRunner().stop();
  getWorkflowStateManager()
    .reset()
    .then(() => sendResponse({ success: true }));
}

/**
 * Handle capability check request.
 */
function handleCheckCapabilities(
  capabilities: string[] | Record<string, any>,
  sendResponse: (response: CapabilitiesResponse) => void
) {
  const runner = getWorkflowRunner();

  runner
    .checkCapabilities(capabilities)
    .then((results) => sendResponse({ success: true, results }))
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      sendResponse({ success: false, error: message });
    });
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
