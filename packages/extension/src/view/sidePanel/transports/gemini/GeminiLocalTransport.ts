// GeminiNanoChatTransport.ts

import {
    convertToModelMessages,
    createUIMessageStream,
    streamText,
    type ChatRequestOptions,
    type ChatTransport,
    type UIMessage,
    type UIMessageChunk,
} from "ai";
import { type LanguageModelV2 } from '@ai-sdk/provider';
import type { AssistantRuntime } from "@assistant-ui/react";
import ChromeAILanguageModel from "./chromeAI";

type SendMessagesParams = {
    /** The type of message submission - either new message or regeneration */
    trigger: 'submit-message' | 'regenerate-message';
    /** Unique identifier for the chat session */
    chatId: string;
    /** ID of the message to regenerate, or undefined for new messages */
    messageId: string | undefined;
    /** Array of UI messages representing the conversation history */
    messages: UIMessage[];
    /** Signal to abort the request if needed */
    abortSignal: AbortSignal | undefined;
} & ChatRequestOptions

/**
 * A type-safe declaration for the experimental Gemini Nano
 * API available on the `window` object in supported browsers
 * (like Chrome).
 */
declare global {
    interface Window {
        LanguageModel?: LanguageModel;
    }
    interface LanguageModel {
        availability(): Promise<"available" | "readily" | "after-download" | "unavailable">;
        create(args: Record<string, any>): Promise<LanguageModelSession>;
    }
    interface LanguageModelSession {
        promptStreaming(prompt: {
            role: string;
            content: any;
        }[]): AsyncIterable<string>;
        prompt(prompt: {
            role: string;
            content: any;
        }[], promptOptions: Record<string, any>): Promise<string>;
    }
}

/**
 * A custom ChatTransport for interfacing with the on-device
 * Gemini Nano API (window.ai.languageModel).
 *
 * This transport does not make any network requests. It calls
 * the browser's built-in LanguageModel API directly.
 */
export class GeminiNanoChatTransport implements ChatTransport<UIMessage> {
    private session: LanguageModelSession | null = null;
    private isInitializing: boolean = false;
    private runtime: AssistantRuntime | null = null;
    formattedTools: any[] = [];
    constructor() { }

    setRuntime(runtime: AssistantRuntime) {
        this.runtime = runtime;
    }
    /**
     * Initializes the on-device model session.
     * This checks for API availability and creates a session.
     */
    async initializeSession(): Promise<void> {
        if (this.session || this.isInitializing) return;

        this.isInitializing = true;
        try {
            const lm = window.LanguageModel;
            if (!lm) {
                throw new Error("Gemini Nano API (window.ai.languageModel) is not available.");
            }

            const availability = await lm.availability();
            if (availability === "unavailable") {
                throw new Error("On-device Gemini Nano model is unavailable.");
            }

        } catch (error) {
            console.error("Failed to initialize Gemini Nano session:", error);
            this.session = null; // Ensure session is null on failure
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * The core method that implements the ChatTransport interface.
     * This is called by `useChat` when a new message is sent.
     */
    async sendMessages(
        params: SendMessagesParams,
    ): Promise<ReadableStream<UIMessageChunk>> {
        const { messages } = params;
        // Wait for initialization if it's in progress
        if (this.isInitializing) {
            await new Promise<void>((resolve) => {
                const check = () => {
                    if (!this.isInitializing) resolve();
                    else setTimeout(check, 100);
                };
                check();
            });
        }
        if (!this.runtime) {
            return new ReadableStream();
        }
        const model = new ChromeAILanguageModel(crypto.randomUUID());
        model.setRuntime(this.runtime);
        const { tools } = this.runtime.thread.getModelContext();

        this.formattedTools = Object.entries(tools ?? []).map(([key, value]) => [key, {
            description: value.description,
            execute: value.execute,
            name: key,
            type: "function"
        }]);
        return createUIMessageStream({
            execute: async ({ writer }) => {
                try {
                    const result = streamText({
                        model: model as unknown as LanguageModelV2,
                        messages: convertToModelMessages(messages),
                        tools: Object.fromEntries(this.formattedTools),
                        providerOptions: {
                            "built-in-ai": {
                                "parallelToolExecution": false
                            }
                        },
                        system: `You are the WebMCP Browsing Agent. Investigate pages, gather context, and guide the user through the browser using Model Context Protocol tools.\n\nBehavior\n• Operate entirely through the provided MCP tools—never assume page state without verifying.\n• Narrate intentions before acting and summarize findings after each tool call.\n• Prefer lightweight inspection (history, tabs, DOM extraction) before triggering heavier actions.\n\nWorkflow\n1. Confirm your objective and current tab context.\n2. Use tab & navigation tools to open or focus the right page.\n3. Extract structured information (dom_extract_*, screenshot, requestInput) instead of guessing.\n4. Record observations and recommend next steps; ask for confirmation before irreversible actions.\n\nSafety\n• Stay within the active browsing session; do not attempt filesystem access or userscript management.\n• Surface uncertainties clearly and request clarification when instructions conflict or lack detail.\n\nYou are a helpful AI assistant with access to tools.# Available Tools\n
                        ${JSON.stringify(this.formattedTools, null, 2)}
                        # Tool Calling Instructions
                        Only request one tool call at a time. Wait for tool results before asking for another tool.
                        To call a tool, output JSON in this exact format inside a \`\`\`tool_call code fence:

                        \`\`\`tool_call
                            {"name": "tool_name", "arguments": {"param1": "value1", "param2": "value2"}}
                        \`\`\`

                        Tool responses will be provided in \`\`\`tool_result fences. Each line contains JSON like:
                        \`\`\`tool_result
                            {"id": "call_123", "name": "tool_name", "result": {...}, "error": false}
                        \`\`\`
                        Use the \`result\` payload (and treat \`error\` as a boolean flag) when continuing the conversation.
                        Important:
                            - Use exact tool and parameter names from the schema above
                            - Arguments must be a valid JSON object matching the tool's parameters
                            - You can include brief reasoning before or after the tool call
                            - If no tool is needed, respond directly without tool_call fences
                    ` ,

                        onError: (err) => {
                            console.error(`AI SDK error [chatId=]:`, err.error);
                        },
                        onAbort: (res) => {
                            console.log(`Stream aborted after ${res.steps.length} steps [chatId=]`);
                        },
                        onStepFinish: (res) => {
                            console.log(`Step finished:`, {
                                finishReason: res.finishReason,
                                toolCalls: res.toolCalls?.length,
                                tokens: res.usage.totalTokens
                            });
                        }
                    });
                    try {
                        // Pipe the AI SDK stream to the UI writer
                        writer.merge(result.toUIMessageStream());
                    } catch (mergeError) {
                        console.error(` Error merging stream [chatId=]:`, mergeError);
                        const errorMessage = mergeError instanceof Error ? mergeError.message : "An error occurred while processing the response";

                        writer.write({
                            type: "text-delta",
                            delta: `\n\n⚠️ Error: ${errorMessage}\n\nThe model may still be processing. Please try again.`,
                            id: crypto.randomUUID()
                        });
                    }

                } catch (executionError) {
                    if (executionError instanceof Error) {
                        console.error(` Stream execution error [chatId=]:`, {
                            message: executionError.message,
                            name: executionError.name,
                            stack: executionError.stack
                        });

                        writer.write({
                            type: "text-delta",
                            delta: `\n\n⚠️ Error: ${executionError.message}\n\nPlease check the console for more details.`,
                            id: crypto.randomUUID()
                        });
                        return;
                    }

                    console.error(`Unknown stream error [chatId=]:`, executionError);
                    writer.write({
                        type: "text-delta",
                        delta: `\n\n⚠️ An unexpected error occurred. Please try again.`,
                        id: crypto.randomUUID()
                    });
                }
            }
        });
    }

    reconnectToStream(options: { chatId: string; } & ChatRequestOptions) {
        return Promise.resolve(new ReadableStream());
    }
}