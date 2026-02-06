/**
 * External dependencies
 */
import {
  ExecutionContext,
  NodeOutput,
  WorkflowJSON,
} from '@google-awlt/engine-core';

/**
 * Internal dependencies
 */
import { WorkflowClient, WorkflowClientCallbacks } from './WorkflowClient';
import logger from '../utils/logger';

/**
 * Workflow Adapter
 *
 * Returns a callback function that can injected into the content script to run a workflow.
 */
export function workflowAdapter(workflowJson: WorkflowJSON, tabId: number) {
  return async () => {
    const callbacks: WorkflowClientCallbacks = {
      onNodeStart: (nodeId: string) => {
        logger(['debug'], ['Node started', nodeId]);
      },
      onNodeFinish: (nodeId: string, output: NodeOutput) => {
        logger(['debug'], ['Node finished', nodeId, output]);
      },
      onComplete: (context: ExecutionContext) => {
        logger(['debug'], ['Workflow completed', context]);
      },
      onError: (error: string) => {
        logger(['error'], ['Workflow error', error]);
      },
    };

    const response = {
      content: {
        type: 'text',
        text: '',
      },
      isError: false,
    };

    const client = new WorkflowClient();
    try {
      const executionContext = await client.runWorkflow(
        workflowJson,
        tabId,
        callbacks
      );

      response.content.text = Object.entries(executionContext)
        .filter(([key]) => key.endsWith('end'))
        .map(([value]) => value)
        .join('\n');
    } catch (error: any) {
      response.content.text = error.message;
      response.isError = true;
    }

    return response;
  };
}
