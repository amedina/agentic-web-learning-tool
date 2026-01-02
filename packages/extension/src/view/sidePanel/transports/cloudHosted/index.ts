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
import { createOllama, type OllamaProviderSettings } from "ollama-ai-provider-v2";
import { type createOpenAI, type OpenAIProviderSettings } from "@ai-sdk/openai";
import type { AnthropicProviderSettings, createAnthropic } from "@ai-sdk/anthropic";
import type { createGoogleGenerativeAI, GoogleGenerativeAIProviderSettings } from "@ai-sdk/google";
/**
 * Internal dependencies
 */
import logger from "../../../../utils/logger";
import { getToolNameWithoutPrefix } from "@google-awlt/design-system";


type JsonSchemaObject = Record<string, unknown>;
type SchemaInput = JsonSchemaObject | (() => JsonSchemaObject);

interface JsonSchemaOptions<T> {
    validate?: (value: unknown) => T | { value: T; error?: unknown };
}

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

export type ModelInitializer = typeof createOllama | typeof createOpenAI | typeof createAnthropic | typeof createGoogleGenerativeAI;
export type ProviderSettings = OllamaProviderSettings | OpenAIProviderSettings | AnthropicProviderSettings | GoogleGenerativeAIProviderSettings;
export class CloudHostedTransport implements ChatTransport<UIMessage> {
    private model: LanguageModelV2 | null = null;
    private isInitializing: boolean = false;
    private runtime: AssistantRuntime | null = null;
    formattedTools: any = {};
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
    async initializeSession(modelInitializerFunction: ModelInitializer, config: ProviderSettings): Promise<void> {
        if (this.model || this.isInitializing) {
            return;
        }

        this.isInitializing = true;
        try {
            //@ts-expect-error -- Gemini provider has different headers type than the Ollama provider
            this.model = modelInitializerFunction(config).languageModel(this.modelId);
        } catch (error) {
            logger(['error'], ["Failed to initialize Gemini Nano session:", error]);
            this.model = null; // Ensure model is null on failure
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Allows you to define a tool's schema using raw JSON Schema 
     * instead of Zod.
     * @param schema - A JSON Schema object OR a function returning one.
     * @param options - Optional validation logic.
     */
    jsonSchema<T = unknown>(schema: SchemaInput, options: JsonSchemaOptions<T> = {}) {
        return {
            [Symbol.for("vercel.ai.schema")]: true,
            _type: undefined,
            get jsonSchema() {
                if (typeof schema === "function") {
                    schema = schema();
                }
                return schema;
            },
            validate: options?.validate
        };
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

        this.formattedTools = {};
        Object.entries(tools ?? []).forEach(([key, value]) => {
            const toolName = getToolNameWithoutPrefix(key);
            this.formattedTools[key] = {
                description: value.description,
                execute: value.execute,
                inputSchema: this.jsonSchema(value.parameters as Record<string, unknown>),
                name: toolName,
                type: "function"
            }
        });

        return createUIMessageStream({
            execute: async ({ writer }) => {
                try {
                    const result = streamText({
                        model: this.model as unknown as LanguageModelV2,
                        messages: convertToModelMessages(messages),
                        tools: this.formattedTools,
                        providerOptions: {
                            openai: {
                                reasoningEffort: "medium",
                            }
                        },
                        abortSignal,
                        stopWhen: ({ steps }) => steps.length === 100,
                        onError: (err) => {
                            logger(['error'], [`AI SDK error [chatId=]:`, err.error]);
                        },
                        onAbort: (res) => {
                            logger(['log', 'trace', 'info'], [`Stream aborted after ${res.steps.length} steps [chatId=]`]);
                        },
                        onStepFinish: (res) => {
                            logger(['log', 'trace', 'debug'], [`Step finished:`, {
                                finishReason: res.finishReason,
                                toolCalls: res.toolCalls?.length,
                                tokens: res.usage.totalTokens
                            }]);
                        }
                    });
                    try {
                        writer.merge(result.toUIMessageStream());
                    } catch (mergeError) {
                        logger(['error'], [` Error merging stream [chatId=]:`, mergeError]);
                        const errorMessage = mergeError instanceof Error ? mergeError.message : "An error occurred while processing the response";

                        writer.write({
                            type: "text-delta",
                            delta: `Error: ${errorMessage}\n\nThe model may still be processing. Please try again.`,
                            id: crypto.randomUUID()
                        });
                    }

                } catch (executionError) {
                    if (executionError instanceof Error) {
                        logger(['error'], [` Stream execution error [chatId=]:`, {
                            message: executionError.message,
                            name: executionError.name,
                            stack: executionError.stack
                        }]);

                        writer.write({
                            type: "text-delta",
                            delta: `Error: ${executionError.message}\n\nPlease check the console for more details.`,
                            id: crypto.randomUUID()
                        });
                        return;
                    }

                    logger(['error'], [`Unknown stream error [chatId=]:`, executionError]);
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