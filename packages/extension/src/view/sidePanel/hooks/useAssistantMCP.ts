import { tool, type AssistantRuntime } from '@assistant-ui/react';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';
import { useEffect, useMemo } from 'react';


import { mcpToolToJSONSchema, validateToolPreferences, } from '../utils';
import { getToolNameForUI } from '../transports/gemini/utils';

/**
 * Hook that bridges MCP tools with the Assistant UI framework
 *
 * Tool Name Translation:
 * - MCP tools come with tab prefixes (e.g., "tab123_createTodo")
 * - Assistant sees clean names (e.g., "createTodo") for better UX
 * - Execution uses the full prefixed name for proper routing
 *
 * This translation allows the AI to use natural tool names while maintaining
 * the tab-based routing system in the background.
 */
export function useAssistantMCP(mcpTools: McpTool[], client: Client, threadId: string, runtime: AssistantRuntime): void {
  // Filter tools based on thread preferences
  const filteredTools = useMemo(() => {
    if (!threadId) return mcpTools;

    const validatedPreferences = validateToolPreferences({});
    const preferences = validatedPreferences[threadId];

    if (!preferences || preferences.length === 0) {
      // If no preferences set, use all tools by default
      return mcpTools;
    }

    // Filter tools to only include those in preferences
    return mcpTools.filter((tool) => {
      console.log('tool', tool.name);
      return preferences.includes(tool.name);
    });
  }, [mcpTools, threadId]);

  const toolNames = useMemo(() => filteredTools.map((t) => t.name).join(', '), [filteredTools]);

  useEffect(() => {
    if (!client) {
      return;
    }

    // Create a mapping of hashed names to original names for tools that exceed 64 chars
    const toolNameMapping = new Map<string, string>();

    // Always register a context provider, even if there are no tools
    const assistantTools = filteredTools.map((mcpT) => {
      // Use hash if the name is too long (64 char limit)
      const toolName = getToolNameForUI(mcpT.name);

      // Store the mapping if we're using a hash
      if (mcpT.name.length >= 64) {
        toolNameMapping.set(toolName, mcpT.name);
      }

      const match = mcpT.name.match(/^tab\d+_(.+)$/);
      const assistantToolName = match ? match[1] : mcpT.name;
      // console.log({ mcpT, assistantToolName, toolName });

      return {
        name: toolName, // Use the potentially hashed name
        originalName: mcpT.name, // Keep original for execution
        assistantTool: tool({
          type: 'frontend',
          description: mcpT.description,
          parameters: mcpToolToJSONSchema(mcpT.inputSchema),
          execute: async (args, { abortSignal: signal }) => {
            try {
              const cleanedArgs = Object.fromEntries(
                Object.entries(args).filter(([, v]) => v !== null && v !== undefined)
              );

              const toolResult = await client.callTool({
                name: mcpT.name,
                arguments: cleanedArgs
              }, undefined, {
                signal: signal
              });

              const toolContent = toolResult.content;
              //@ts-expect-error -- api is not widely available
              if (toolContent.some(part => part.type === "image")) {
                //@ts-expect-error -- api is not widely available
                const images = toolContent.filter(part => part.type === "image");
                const imageCount = images.length;

                if (imageCount === 1) {
                  const imagePart = images[0];

                  // Format result as a standard image content part
                  const resultPart = {
                    type: "image",
                    data: imagePart.data,
                    mimeType: imagePart.mimeType
                  };
                  return resultPart;
                }

                // Handle multiple images
                //@ts-expect-error -- api is not widely available
                const resultParts = images.map((imagePart, index) => {
                  console.log(`[useAssistantMCP] Image ${index + 1}/${imageCount}: ${imagePart.mimeType}, ${imagePart.data.length} bytes (using placeholder)`);
                  return {
                    type: "image",
                    data: imagePart.data,
                    mimeType: imagePart.mimeType
                  };
                });
                console.log(`[useAssistantMCP] Returning ${imageCount} image parts:`, resultParts);
                return resultParts;
              }

              // Handle simple text results
              //@ts-expect-error -- api is not widely available
              if (toolContent.length === 1 && toolContent[0].type === "text") {
                //@ts-expect-error -- api is not widely available
                return toolContent[0].text;
              }

              // Handle generic or mixed results
              //@ts-expect-error -- api is not widely available
              const processedContent = toolContent.map(part =>
                part.type === "text" ? { type: "text", text: part.text } : part
              );

              return processedContent.length === 1 && processedContent[0].type === "text" ? processedContent[0].text : processedContent;

            } catch (error) {
              console.error(`[useAssistantMCP] Tool ${assistantToolName} failed:`, error);
              // Rethrow the error for the assistant runtime to handle
              throw error;
            }
          },
        }),
      };
    });

    const unregister = runtime.registerModelContextProvider({
      getModelContext: () => ({
        system: filteredTools.length > 0 ? 'TOOLS:' : '',
        tools: Object.fromEntries(assistantTools.map((t) => [t.name, t.assistantTool])),
      }),
    });

    return () => {
      unregister();
    };
  }, [client, toolNames, threadId]);

  return;
}
