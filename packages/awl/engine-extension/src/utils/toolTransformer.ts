/**
 * External dependencies
 */
import type { WorkflowMeta } from '@google-awlt/engine-core';

/**
 * Transforms a workflow JSON object into a WebMCPTool object.
 * This allows the workflow to be registered and executed as a tool within the WebMCP ecosystem.
 *
 * @param meta The workflow metadata to transform.
 * @returns A WebMCPTool configuration object.
 */
export function transformWorkflowToTool(meta: WorkflowMeta) {
  return {
    name: meta.sanitizedName || meta.name,
    title: meta.name, // Use name as title
    description: meta.description || 'A user-defined workflow',
    allowedDomains: meta.allowedDomains || [],
    namespace: 'workflow',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    enabled: meta.enabled ?? false,
  };
}
