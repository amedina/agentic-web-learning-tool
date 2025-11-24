import type { InputMessage, ConversionResult, FormattedMessage, ToolCall, ToolResultInput } from "../../../types";

/**
 * Converts generic chat messages into a format suitable for the Chrome Built-in AI Prompt API.
 *
 * Protocol:
 * - System messages are extracted separately.
 * - Tool Calls are formatted into a Markdown block: ```tool_call ... ``` inside an Assistant message.
 * - Tool Results are formatted into a Markdown block: ```tool_result ... ``` inside a User message.
 */
export function convertMessages(inputMessages: InputMessage[]): ConversionResult {
  const messagesCopy = [...inputMessages];
  const formattedMessages: FormattedMessage[] = [];
  let systemMessage: any = undefined;

  for (const message of messagesCopy) {
    switch (message.role) {
      case "system": {
        systemMessage = message.content;
        break;
      }

      case "user": {
        const content = message.content.map((part) => {
          if (part.type === "text") {
            return { type: "text" as const, value: part.text || "" };
          }
          throw new Error(`Unsupported content type in user message: ${part.type ?? "unknown"}`);
        });

        formattedMessages.push({
          role: "user",
          content: content,
        });
        break;
      }

      case "assistant": {
        let textAccumulator = "";
        const toolCalls: ToolCall[] = [];

        for (const part of message.content) {
          switch (part.type) {
            case "text":
            case "reasoning": {
              // Merge standard text and reasoning/thoughts into the main content
              if (part.text) textAccumulator += part.text;
              break;
            }
            case "tool-call": {
              toolCalls.push(part as ToolCall);
              break;
            }
            default: {
              throw new Error(`Unsupported assistant part type: ${part.type ?? "unknown"}`);
            }
          }
        }

        // Format tool calls into the specific Markdown block expected by the provider
        const toolCallsBlock = formatToolCalls(toolCalls);

        const contentParts: string[] = [];
        if (textAccumulator.trim().length > 0) {
          contentParts.push(textAccumulator);
        }
        if (toolCallsBlock) {
          contentParts.push(toolCallsBlock);
        }

        formattedMessages.push({
          role: "assistant",
          content: contentParts.join("\n") || "",
        });
        break;
      }

      case "tool": {
        // Process raw tool outputs into a standardized format
        const processedResults = message.content.map(processToolResultEntry);
        
        // Wrap results in the specific Markdown block
        const resultsBlock = formatToolResultsBlock(processedResults);

        // Protocol Requirement: Tool results are injected as a USER message
        formattedMessages.push({
          role: "user",
          content: resultsBlock,
        });
        break;
      }

      default: {
        throw new Error(`Unsupported role: ${message.role ?? "unknown"}`);
      }
    }
  }

  return {
    systemMessage,
    messages: formattedMessages,
  };
}

/**
 * Safe JSON parser. Returns the original string or empty object on failure.
 */
function safeParseJson(input: string | object | undefined): any {
  if (input === undefined) return {};
  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }
  return input ?? {};
}

/**
 * Formats an array of tool calls into a Markdown code block.
 */
function formatToolCalls(toolCalls: ToolCall[]): string {
  if (!toolCalls.length) return "";

  const lines = toolCalls.map((call) => {
    const payload: any = {
      name: call.toolName,
      arguments: safeParseJson(call.input),
    };
    if (call.toolCallId) {
      payload.id = call.toolCallId;
    }
    return JSON.stringify(payload);
  });

  return `\`\`\`tool_call\n${lines.join("\n")}\n\`\`\``;
}

/**
 * Extracts the raw value and error status from a tool's output structure.
 */
function extractToolOutputValue(output: any): { value: any; isError: boolean } {
  switch (output.type) {
    case "text":
    case "json":
    case "content":
      return { value: output.value, isError: false };
    case "error-text":
    case "error-json":
      return { value: output.value, isError: true };
    default:
      // Fallback for raw values not wrapped in a type object
      return { value: output, isError: false };
  }
}

/**
 * Processes a single tool result entry from the input message.
 */
function processToolResultEntry(entry: ToolResultInput) {
  const { value, isError } = extractToolOutputValue(entry.output);
  return {
    toolCallId: entry.toolCallId,
    toolName: entry.toolName,
    result: value,
    isError: isError,
  };
}

/**
 * Formats a single processed tool result for the final block.
 */
function formatSingleResultForBlock(entry: { toolName: string; result: any; isError: boolean; toolCallId?: string }) {
  const payload: any = {
    name: entry.toolName,
    result: entry.result ?? null,
    error: !!entry.isError,
  };
  if (entry.toolCallId) {
    payload.id = entry.toolCallId;
  }
  return payload;
}

/**
 * Formats an array of processed tool results into a Markdown code block.
 */
function formatToolResultsBlock(results: any[]): string {
  if (!results || results.length === 0) return "";

  const lines = results.map((r) => JSON.stringify(formatSingleResultForBlock(r)));

  return `\`\`\`tool_result\n${lines.join("\n")}\n\`\`\``;
}