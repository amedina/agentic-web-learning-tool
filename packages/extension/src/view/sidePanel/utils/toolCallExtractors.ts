/**
 * Internal dependencies
 */
import type { ToolCallRequest } from "../types";

export function extractToolCall(text: string): { toolCall: ToolCallRequest[] | null, textPrefix: string | null } {
    const FENCE_START = "```tool_call";
    const FENCE_END = "```";

    const startIndex = text.indexOf(FENCE_START);
    if (startIndex === -1) {
        return { toolCall: null, textPrefix: null };
    }

    const endIndex = text.indexOf(FENCE_END, startIndex + FENCE_START.length);
    if (endIndex === -1) {
        return { toolCall: null, textPrefix: null };
    }

    const textPrefix = text.slice(0, startIndex).trim();
    const jsonBlock = text.slice(startIndex + FENCE_START.length, endIndex).trim();

    try {
        const toolCall: ToolCallRequest = JSON.parse(jsonBlock);
        return { toolCall: [toolCall], textPrefix: textPrefix || null };
    } catch (error) {
        console.error("Failed to parse tool call JSON:", error);
        return { toolCall: null, textPrefix: null };
    }
}

/**
 * Extracts tool calls from a string and cleans the text.
 * @param {string} text - The raw input text containing potential tool blocks.
 * @returns {{ toolCalls: Array, textContent: string }}
 */
export function extractToolCalls(text: string) {
    const TOOL_BLOCK_REGEX = /```tool[_-]?call\s*([\s\S]*?)```/gi;
    // Find all matches of the tool block regex in the text
    const matches = Array.from(text.matchAll(TOOL_BLOCK_REGEX));

    // Reset regex index (safety for global regexes)
    TOOL_BLOCK_REGEX.lastIndex = 0;

    // If no tool calls are found, return original text
    if (matches.length === 0) {
        return {
            toolCalls: [],
            textContent: text
        };
    }

    const extractedCalls = [];
    let cleanText = text;

    for (const match of matches) {
        const [fullMatchString, innerContent] = match;

        // Remove the entire ```tool_call ... ``` block from the main text
        cleanText = cleanText.replace(fullMatchString, "");

        try {
            const jsonString = innerContent.trim();

            // Strategy 1: Try to parse the entire block as standard JSON
            try {
                const parsed = JSON.parse(jsonString);
                
                // Handle both a single object or an array of objects
                const items = Array.isArray(parsed) ? parsed : [parsed];

                for (const item of items) {
                    if (item.name) {
                        extractedCalls.push({
                            type: "tool-call",
                            toolCallId: item.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                            toolName: item.name,
                            args: item.arguments || {}
                        });
                    }
                }
            } catch (jsonError) {
                // Strategy 2: Fallback for Newline Delimited JSON (NDJSON)
                // Sometimes LLMs output multiple JSON objects separated by newlines
                // instead of a proper comma-separated array.
                const lines = jsonString.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    try {
                        const item = JSON.parse(line.trim());
                        if (!item.name) continue;

                        extractedCalls.push({
                            type: "tool-call",
                            toolCallId: item.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                            toolName: item.name,
                            args: item.arguments || {}
                        });
                    } catch (lineError) {
                        // Skip lines that aren't valid JSON
                        continue;
                    }
                }
            }
        } catch (error) {
            console.warn("Failed to parse JSON tool call:", error);
            continue;
        }
    }

    // Collapse multiple newlines left behind by removals into a single newline
    cleanText = cleanText.replace(/\n{2,}/g, '\n');

    return {
        toolCalls: extractedCalls,
        textContent: cleanText.trim()
    };
}
