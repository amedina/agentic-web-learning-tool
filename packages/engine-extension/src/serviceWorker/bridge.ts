/**
 * Internal dependencies
 */
import { initContentScriptBridge } from '../contentScript';
import type {
  ServiceWorkerMessage,
  WorkflowResponse,
  CapabilitiesResponse,
  NodeStatusUpdate,
  WorkflowCompleteUpdate,
  WorkflowErrorUpdate,
} from '../types/messages';
import { getWorkflowRunner } from './runner';

/**
 * Service Worker Bridge
 *
 * Handles messages from the UI/Options page and coordinates workflow execution.
 */
function handleMessage(
  message: ServiceWorkerMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: WorkflowResponse | CapabilitiesResponse) => void
): boolean {
  switch (message.type) {
    case 'RUN_WORKFLOW':
      handleRunWorkflow(message.workflow, message.tabId, sender, sendResponse);
      return true;

    case 'CHECK_CAPABILITIES':
      handleCheckCapabilities(message.capabilities, sendResponse);
      return true;

    case 'STOP_WORKFLOW':
      getWorkflowRunner().stop();
      sendResponse({ success: true });
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
  workflow: any,
  tabId: number | undefined,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: WorkflowResponse) => void
) {
  const runner = getWorkflowRunner();
  const targetTabId = tabId ?? sender?.tab?.id;

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
      } catch (error) {
        await chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          func: initContentScriptBridge,
          injectImmediately: true,
          args: [targetTabId],
        });
      }
    }

    const context = await runner.run(workflow, targetTabId, {
      onNodeStart: (nodeId) => {
        broadcastStatusUpdate({
          type: 'NODE_STATUS',
          nodeId,
          output: { status: 'running' },
        });
      },
      onNodeFinish: (nodeId, output) => {
        broadcastStatusUpdate({
          type: 'NODE_STATUS',
          nodeId,
          output,
        });
      },
      onError: (error) => {
        broadcastStatusUpdate({
          type: 'WORKFLOW_ERROR',
          error: error.message,
        });
      },
    });

    broadcastStatusUpdate({
      type: 'WORKFLOW_COMPLETE',
      context,
    });

    sendResponse({ success: true, context });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendResponse({ success: false, error: message });
  }
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
 * Broadcast status updates.
 */
function broadcastStatusUpdate(
  update: NodeStatusUpdate | WorkflowCompleteUpdate | WorkflowErrorUpdate
): void {
  chrome.runtime.sendMessage(update).catch(() => {
    // Ignore errors if no listeners
  });
}

/**
 * Initialize the service worker bridge.
 */
export function initServiceWorkerBridge(): void {
  chrome.runtime.onMessage.addListener(handleMessage);
  console.log('[Workflow] Service worker bridge initialized');
}
