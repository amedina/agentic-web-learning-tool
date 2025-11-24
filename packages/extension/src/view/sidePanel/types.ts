/**
 * A type for the JSON structure we expect
 * inside the fenced tool call.
 */
export type ToolCallRequest = {
    toolName: string;
    arguments: Record<string, any>;
    toolCallId: string;
    type: string;
};

export type Role = "system" | "user" | "assistant" | "tool";

export interface ToolCall {
  type: "tool-call";
  toolName: string;
  toolCallId?: string;
  input: string | object;
}

export interface ToolResultInput {
  type: "tool-result"; // implied context
  toolCallId?: string;
  toolName: string;
  output: {
    type?: "text" | "json" | "error-text" | "error-json" | "content";
    value: any;
  };
}

export interface ContentPart {
  type: "text" | "reasoning" | "tool-call";
  text?: string;
  // Specific properties for tool calls are handled via union or intersection in real-world apps,
  // but strictly mapping the input structure here:
  toolName?: string;
  toolCallId?: string;
  input?: string | object;
}

export interface InputMessage {
  role: string; // string allows for flexibility, but practically matches Role
  content: any[]; // Keeping generic to handle the specific structure of the input
}

export interface FormattedMessage {
  role: "user" | "assistant";
  content: string | { type: "text"; value: string }[];
}

export interface ConversionResult {
  systemMessage?: any; // Content of the system message
  messages: FormattedMessage[];
}

