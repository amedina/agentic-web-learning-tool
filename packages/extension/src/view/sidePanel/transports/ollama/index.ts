/**
 * External dependencies
 */
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
import { createOllama } from 'ollama-ai-provider-v2';
/**
 * Internal dependencies
 */
import { systemPromptTemplate } from "../../utils";

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
 * A custom ChatTransport for interfacing with the on-device
 * Gemini Nano API (window.languageModel).
 *
 * This transport does not make any network requests. It calls
 * the browser's built-in LanguageModel API directly.
 */
export class OllamaTransport implements ChatTransport<UIMessage> {
    private model: LanguageModelV2 | null = null;
    private isInitializing: boolean = false;
    private runtime: AssistantRuntime | null = null;
    formattedTools: any[] = [];
    private modelId: string = ""
    constructor(modelId: string) {
        this.modelId = modelId;
     }

    setRuntime(runtime: AssistantRuntime) {
        this.runtime = runtime;
    }
    /**
     * Initializes the on-device model session.
     * This checks for API availability and creates a session.
     */
    async initializeSession(): Promise<void> {
        if (this.model || this.isInitializing) {
            return;
        }

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

            this.model = createOllama({
            baseURL: "https://ollama.gagan.pro/api"
        }).languageModel(this.modelId);
        } catch (error) {
            console.error("Failed to initialize Gemini Nano session:", error);
            this.model = null; // Ensure model is null on failure
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
        const { messages, abortSignal } = params;

        if (!this.runtime) {
            return new ReadableStream();
        }

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
                        model: this.model as unknown as LanguageModelV2,
                        messages: convertToModelMessages(messages),
                        tools: Object.fromEntries(this.formattedTools),
                        abortSignal,
                        stopWhen: ({ steps }) => steps.length === 100,
                        system: systemPromptTemplate(JSON.stringify(this.formattedTools, null, 2)),

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
                        writer.merge(result.toUIMessageStream());
                    } catch (mergeError) {
                        console.error(` Error merging stream [chatId=]:`, mergeError);
                        const errorMessage = mergeError instanceof Error ? mergeError.message : "An error occurred while processing the response";

                        writer.write({
                            type: "text-delta",
                            delta: `Error: ${errorMessage}\n\nThe model may still be processing. Please try again.`,
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
                            delta: `Error: ${executionError.message}\n\nPlease check the console for more details.`,
                            id: crypto.randomUUID()
                        });
                        return;
                    }

                    console.error(`Unknown stream error [chatId=]:`, executionError);
                    writer.write({
                        type: "text-delta",
                        delta: `An unexpected error occurred. Please try again.`,
                        id: crypto.randomUUID()
                    });
                }
            }
        });
    }

    reconnectToStream(_options: { chatId: string; } & ChatRequestOptions) {
        return Promise.resolve(new ReadableStream());
    }
}