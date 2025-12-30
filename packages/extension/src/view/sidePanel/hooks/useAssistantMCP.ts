/**
 * External dependencies
 */
import { tool, type AssistantRuntime } from '@assistant-ui/react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Tool as McpTool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { useEffect, useMemo } from 'react';

/**
 * Internal dependencies
 */
import { cleanArguments, formatToolResult, getToolNameForUI, mcpToolToJSONSchema, validateToolPreferences } from '../utils';
import type { ToolExecutionArgs } from '../types';
import logger from '../../../utils/logger';

/**
 * Hook that bridges MCP tools with the Assistant UI framework.
 *
 * Capabilities:
 * 1. Filters tools based on user/thread preferences.
 * 2. Translates verbose MCP tool names (e.g., "tab123_createTodo") to UI-friendly names ("createTodo").
 * 3. Handles the execution of tools via the MCP Client.
 * 4. Formats complex results (images/text) for the Assistant runtime.
 *
 * @param mcpTools - The list of raw tools provided by the MCP server.
 * @param client - The connected MCP client instance.
 * @param threadId - The current active thread ID (used for preference filtering).
 * @param runtime - The Assistant UI runtime instance.
 */
export function useAssistantMCP(
  mcpTools: McpTool[],
  client: Client | null, // Allow null for initial loading states
  threadId: string,
  runtime: AssistantRuntime
): void {
  // 1. Filter tools based on thread preferences
  const filteredTools = useMemo(() => {
    if (!threadId) return mcpTools;

    // Retrieve preferences (Assuming validateToolPreferences handles storage retrieval internally)
    const validatedPreferences = validateToolPreferences({});
    const preferences = validatedPreferences[threadId];

    if (!preferences || preferences.length === 0) {
      // If no preferences set, allow all tools
      return mcpTools;
    }

    // Only include tools present in the whitelist
    return mcpTools.filter((tool) => preferences.includes(tool.name));
  }, [mcpTools, threadId]);

  // Create a stable dependency key for the effect based on tool names
  const toolSignature = useMemo(
    () => filteredTools.map((t) => t.name).join(','),
    [filteredTools]
  );

  // 2. Register tools with the Assistant Runtime
  useEffect(() => {
    if (!client) return;

    // Transform MCP tools into Assistant UI tools
    const assistantTools = filteredTools.map((mcpT) => {
      // Generate a clean name for the UI (handles length limits & hashing if needed)
      const uiToolName = mcpT.name === 'dummyTool' ? mcpT.name : getToolNameForUI(mcpT.name);

      // Extract a human-readable name for logging (removes "tab123_" prefix)
      const match = mcpT.name.match(/^tab\d+_(.+)$/);
      const logName = match ? match[1] : mcpT.name;
      return {
        name: uiToolName,
        // The Assistant UI 'tool' definition
        assistantTool: tool({
          type: 'frontend',
          description: mcpT.description,
          parameters: mcpToolToJSONSchema(mcpT.inputSchema),
          execute: async (args, { abortSignal: signal }) => {
            try {
              const cleanedArgs = cleanArguments(args as ToolExecutionArgs);

              // Execute against the MCP Client using the *Original* name
              const toolResult = await client.callTool(
                {
                  name: mcpT.name,
                  arguments: cleanedArgs,
                },
                undefined,
                { signal }
              );

              return formatToolResult(toolResult.content as CallToolResult['content']);
            } catch (error) {
              logger(['error'], [`[useAssistantMCP] Tool execution failed for '${logName}': ${error}`]);
            }
          },
        }),
      };
    }).filter((singleTool) => singleTool.name !== 'dummyTool');

    // Register the Context Provider with the Runtime
    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        // Hint to the model that tools are available
        system: filteredTools.length > 0 ? 'TOOLS:' : '',
        // Map: { [uiName]: ToolDefinition } 
        tools: Object.fromEntries(assistantTools.map((t) => [t.name, t.assistantTool])),
      }),
    });

    return () => {
      unregister();
    };
  }, [client, toolSignature, runtime, filteredTools]);
}
