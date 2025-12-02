/**
 * External dependencies
 */
import type { AssistantRuntime } from "@assistant-ui/react";

/**
 * Internal dependencies
 */
import {
    ToolCallParser,
    extractArguments,
    convertMessages,
    extractToolCall,
    extractToolCalls,
    extractToolName,
    mergeSystemAndMessages,
    systemPromptTemplate
} from "../../utils";
import type { ToolCallRequest } from "../../types";

interface PromptOptions {
    temperature?: number;
    topK?: number;
    responseConstraint?: any;
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
    destroy: () => void;
}

interface LanguageModelFactory {
    availability(): Promise<"available" | "readily" | "after-download" | "unavailable">;
    create(args: Record<string, any>): Promise<LanguageModelSession>;
}

declare global {
    interface Window {
        // Current experimental API shape
        LanguageModel: LanguageModelFactory;
    }
}
interface LanguageModelV1CallOptions {
    temperature?: number;
    topK?: number;
    responseFormat?: { type: "json"; schema?: any };
    tools?: ToolCallRequest[];
    prompt: any; // Standard AI SDK message format
    abortSignal?: AbortSignal;
}

/**
 * Implementation of the LanguageModelV1 interface for Chrome's built-in Prompt API.
 * * This class handles:
 * 1. Session management with window.LanguageModel
 * 2. Polyfilling "Tool Calling" by instructing the model to output Markdown Fences
 * 3. Streaming parsing to detect those fences and emit structured tool events instead of raw text
 */
class ChromeAILanguageModel {
    private session: LanguageModelSession | null = null;
    private runtime: AssistantRuntime | null = null;
    private formattedTools: any[] = [];

    public readonly specificationVersion = "v1";
    public readonly provider = "browser-ai";
    public readonly modelId: string;

    // Defines supported media types (images/audio) via URL patterns
    public readonly supportedUrls = {
        "image/*": [/^https?:\/\/.+$/],
        "audio/*": [/^https?:\/\/.+$/]
    };

    constructor(modelId: string) {
        this.modelId = modelId;
    }

    public setRuntime(runtime: AssistantRuntime) {
        this.runtime = runtime;
    }

    /**
     * Initializes or retrieves the Chrome AI session.
     * Converts AssistantUI tools into a JSON schema format understandable by the model.
     */
    private async getSession() {
        if (!this.runtime) {
            return;
        }

        // Use global window object for Chrome AI
        const lm = window.LanguageModel;
        if (!lm) {
            throw new Error("Chrome LanguageModel API is not available in this browser.");
        }

        const { tools } = this.runtime.thread.getModelContext();

        // Transform tools into OpenAI-like JSON schema for the system prompt
        this.formattedTools = Object.entries(tools ?? []).map(([key, value]) => [key, {
            name: key,
            description: value.description,
            inputSchema: value.parameters,
            execute: value.execute,
            type: "function"
        }]);

        // Create session if it doesn't exist
        // Note: In a real app, you might want to manage session lifecycle more aggressively (destroying old ones)
        this.session = await lm.create({});
    }

    /**
     * Prepares arguments, validates settings, and formats system prompts.
     */
    private getArgs(args: LanguageModelV1CallOptions) {
        const {
            temperature,
            topK,
            responseFormat,
            tools,
            prompt
        } = args;

        const functionTools = (tools ?? []).filter((tool) => tool.type === 'function');
        const promptOptions: PromptOptions = {};

        if (responseFormat?.type === "json") {
            promptOptions.responseConstraint = responseFormat.schema;
        }

        if (temperature !== undefined) promptOptions.temperature = temperature;
        if (topK !== undefined) promptOptions.topK = topK;

        const { messages } = convertMessages(prompt);

        // Provide the transformed messages and options
        return {
            promptOptions,
            functionTools,
            messages
        };
    }

    /**
     * Handles non-streaming generation (Unary call).
     */
    async doGenerate(callOptions: LanguageModelV1CallOptions) {
        const { promptOptions, messages } = this.getArgs(callOptions);

        await this.getSession();
        if (!this.session) return;

        // Merge the System Prompt (with tool definitions) into the message history
        const systemMessage = systemPromptTemplate(JSON.stringify(this.formattedTools, null, 2));
        const finalMessages = mergeSystemAndMessages(messages, systemMessage);

        // Execute prompt
        const responseText = await this.session.prompt([...finalMessages], promptOptions);

        // Parse the full response to check for ```tool_call blocks
        const { toolCall: toolCalls, textPrefix: textContent } = extractToolCall(responseText);

        // 1. Handle Tool Calls Found in response
        if (toolCalls && toolCalls.length > 0) {
            const firstBatch = toolCalls.slice(0, 1); // Logic currently only handles one batch/tool at a time
            const content = [];

            if (textContent) {
                content.push({ type: "text", text: textContent });
            }

            for (const call of firstBatch) {
                content.push({
                    type: "tool-call",
                    toolCallId: call.toolCallId,
                    toolName: call.toolName,
                    input: JSON.stringify(call.arguments ?? {})
                });
            }

            return {
                content,
                finishReason: "tool-calls",
                usage: { inputTokens: undefined, outputTokens: undefined, totalTokens: undefined },
                request: { body: { messages: finalMessages, options: promptOptions } },
            };
        }

        // 2. Handle Plain Text response
        return {
            content: [{ type: "text", text: textContent || responseText }],
            finishReason: "stop",
            usage: { inputTokens: undefined, outputTokens: undefined, totalTokens: undefined },
            request: { body: { messages: finalMessages, options: promptOptions } },
        };
    }

    /**
     * Handles streaming generation.
     * This is complex because we must scan the stream for ` ```tool_call ` fences.
     * If a fence is detecting, we suppress the raw text and emit `tool-call` events instead.
     */
    async doStream(callOptions: LanguageModelV1CallOptions) {
        const { messages, promptOptions } = this.getArgs(callOptions);

        await this.getSession();
        if (!this.session) return;

        const systemMessage = systemPromptTemplate(JSON.stringify(this.formattedTools, null, 2));
        const finalMessages = mergeSystemAndMessages(messages, systemMessage);

        const messageContext = [...finalMessages];
        const textPartId = "text-0";

        return {
            stream: new ReadableStream({
                start: async (controller) => {
                    // 1. Emit stream start event
                    controller.enqueue({ type: "stream-start" });

                    // Stream State Tracking
                    let hasStartedText = false;
                    let hasFinished = false;
                    let isAborted = false;
                    let activeStreamReader: ReadableStreamDefaultReader<string> | null = null;

                    // --- Helper: Event Emitters ---

                    const emitTextStart = () => {
                        if (!hasStartedText) {
                            controller.enqueue({ type: "text-start", id: textPartId });
                            hasStartedText = true;
                        }
                    };

                    const emitTextDelta = (delta: string) => {
                        if (delta) {
                            emitTextStart();
                            controller.enqueue({ type: "text-delta", id: textPartId, delta });
                        }
                    };

                    const emitTextEnd = () => {
                        if (hasStartedText) {
                            controller.enqueue({ type: "text-end", id: textPartId });
                            hasStartedText = false;
                        }
                    };

                    const finishStream = (reason: "stop" | "tool-calls" | "length" | "error" | "other") => {
                        if (!hasFinished) {
                            hasFinished = true;
                            emitTextEnd();
                            controller.enqueue({
                                type: "finish",
                                finishReason: reason,
                                usage: { outputTokens: undefined, totalTokens: undefined }
                            });
                            controller.close();
                        }
                    };

                    // --- Helper: Abort Handling ---

                    const handleAbort = () => {
                        if (!isAborted) {
                            isAborted = true;
                            activeStreamReader?.cancel().catch(() => { });
                            finishStream("stop");
                        }
                    };

                    if (callOptions.abortSignal) {
                        callOptions.abortSignal.addEventListener("abort", handleAbort);
                    }

                    // --- Main Stream Logic ---

                    const MAX_LOOPS = 10; // Safety breaker for recursive/looped generation attempts
                    let loopCount = 0;

                    try {
                        // Helper class that maintains buffer and detects regex patterns across chunks
                        const fenceScanner = new ToolCallParser();

                        while (loopCount < MAX_LOOPS && !isAborted && !hasFinished) {
                            loopCount++;

                            if (!this.session) {
                                finishStream("stop");
                                return;
                            }

                            // Start the browser stream
                            //@ts-expect-error -- api unavailable hence the error
                            activeStreamReader = this.session.promptStreaming(messageContext).getReader();

                            // Parsing State
                            let toolCallsFound: any[] = [];
                            let hasToolCalls = false;
                            let textBuffer = "";
                            let currentToolCallId: string | null = null;
                            let hasEmittedToolStart = false;
                            let rawToolBuffer = ""; // Buffers the JSON string inside the fence
                            let processedArgLength = 0;
                            let isInFence = false;

                            // Read Loop
                            while (!isAborted && activeStreamReader) {
                                const { done, value: chunk } = await activeStreamReader.read();
                                if (done) break;

                                // 1. Feed chunk to scanner
                                fenceScanner.addChunk(chunk);

                                // 2. Process scanner buffer
                                while (fenceScanner.hasContent()) {
                                    const wasInFence = isInFence;
                                    const scanResult = fenceScanner.detectStreamingFence();
                                    isInFence = scanResult.inFence;

                                    let processedContent = false;

                                    // Case A: Just entered a fence (Transition In)
                                    if (!wasInFence && scanResult.inFence) {
                                        // Flush any safe text before the fence started
                                        if (scanResult.safeContent) {
                                            emitTextDelta(scanResult.safeContent);
                                            processedContent = true;
                                        }

                                        // Initialize new Tool Call
                                        currentToolCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                                        hasEmittedToolStart = false;
                                        rawToolBuffer = "";
                                        processedArgLength = 0;
                                        isInFence = true;
                                        continue; // Loop to process next part of buffer
                                    }

                                    // Case B: Just exited a fence (Transition Out / Complete)
                                    if (scanResult.completeFence) {
                                        processedContent = true;

                                        // Add final piece of content to buffer
                                        if (scanResult.safeContent) {
                                            rawToolBuffer += scanResult.safeContent;
                                        }

                                        // Flush any remaining arguments
                                        if (hasEmittedToolStart && currentToolCallId) {
                                            const allArgs = extractArguments(rawToolBuffer);
                                            if (allArgs.length > processedArgLength) {
                                                const deltaArgs = allArgs.slice(processedArgLength);
                                                processedArgLength = allArgs.length;
                                                if (deltaArgs.length > 0) {
                                                    controller.enqueue({
                                                        type: "tool-input-delta",
                                                        id: currentToolCallId,
                                                        delta: deltaArgs
                                                    });
                                                }
                                            }
                                        }

                                        // Parse the full block to confirm it's a valid tool call
                                        const parsedCalls = extractToolCalls(scanResult.completeFence).toolCalls.slice(0, 1);

                                        if (parsedCalls.length === 0) {
                                            // FALSE ALARM: It was just a regular code block, not a tool_call.
                                            // Emit the raw markdown we buffered back to the user as text.
                                            toolCallsFound = [];
                                            hasToolCalls = false;
                                            emitTextDelta(scanResult.completeFence);
                                            if (scanResult.textAfterFence) {
                                                emitTextDelta(scanResult.textAfterFence);
                                            }

                                            // Reset State
                                            currentToolCallId = null;
                                            hasEmittedToolStart = false;
                                            rawToolBuffer = "";
                                            processedArgLength = 0;
                                            isInFence = false;
                                            continue;
                                        }

                                        // VALID TOOL CALL
                                        if (parsedCalls.length > 0 && currentToolCallId) {
                                            parsedCalls[0].toolCallId = currentToolCallId;
                                        }

                                        toolCallsFound = parsedCalls;
                                        hasToolCalls = toolCallsFound.length > 0;

                                        // Emit final Tool Call events
                                        for (const [idx, tool] of toolCallsFound.entries()) {
                                            const callId: string = (idx === 0 && currentToolCallId) ? currentToolCallId : tool.toolCallId;
                                            const name = tool.toolName;
                                            const argsString = JSON.stringify(tool.args ?? {});

                                            if (callId === currentToolCallId) {
                                                // Ensure start event was sent
                                                if (!hasEmittedToolStart) {
                                                    controller.enqueue({ type: "tool-input-start", id: callId, toolName: name });
                                                    hasEmittedToolStart = true;
                                                }

                                                // Sync final args delta
                                                const currentArgs = extractArguments(rawToolBuffer);
                                                if (currentArgs.length > processedArgLength) {
                                                    const diff = currentArgs.slice(processedArgLength);
                                                    processedArgLength = currentArgs.length;
                                                    if (diff.length > 0) {
                                                        controller.enqueue({ type: "tool-input-delta", id: callId, delta: diff });
                                                    }
                                                }
                                            } else {
                                                // Secondary calls in same block (rare edge case)
                                                controller.enqueue({ type: "tool-input-start", id: callId, toolName: name });
                                                if (argsString.length > 0) {
                                                    controller.enqueue({ type: "tool-input-delta", id: callId, delta: argsString });
                                                }
                                            }

                                            controller.enqueue({ type: "tool-input-end", id: callId });
                                            controller.enqueue({
                                                type: "tool-call",
                                                toolCallId: callId,
                                                toolName: name,
                                                input: argsString,
                                                providerExecuted: false
                                            });
                                        }

                                        if (scanResult.textAfterFence) {
                                            textBuffer += scanResult.textAfterFence;
                                        }

                                        processedContent = true;

                                        // Stop reading the browser stream immediately if we found a tool.
                                        // We need to yield control back to the runtime to execute the tool.
                                        if (hasToolCalls && activeStreamReader) {
                                            await activeStreamReader.cancel().catch(() => { });
                                            break; // Break the inner Read Loop
                                        }

                                        // Reset State
                                        currentToolCallId = null;
                                        hasEmittedToolStart = false;
                                        rawToolBuffer = "";
                                        processedArgLength = 0;
                                        isInFence = false;
                                        continue;
                                    }

                                    // Case C: Inside a fence (Streaming Args)
                                    if (isInFence) {
                                        if (scanResult.safeContent) {
                                            rawToolBuffer += scanResult.safeContent;
                                            processedContent = true;

                                            // Try to extract tool name early
                                            const extractedName = extractToolName(rawToolBuffer);
                                            if (extractedName && !hasEmittedToolStart && currentToolCallId) {
                                                controller.enqueue({
                                                    type: "tool-input-start",
                                                    id: currentToolCallId,
                                                    toolName: extractedName
                                                });
                                                hasEmittedToolStart = true;
                                            }

                                            // Streaming JSON arguments
                                            if (hasEmittedToolStart && currentToolCallId) {
                                                const currentArgs = extractArguments(rawToolBuffer);
                                                if (currentArgs.length > processedArgLength) {
                                                    const diff = currentArgs.slice(processedArgLength);
                                                    processedArgLength = currentArgs.length;
                                                    if (diff.length > 0) {
                                                        controller.enqueue({
                                                            type: "tool-input-delta",
                                                            id: currentToolCallId,
                                                            delta: diff
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                        continue;
                                    }

                                    // Case D: Regular Text
                                    if (!isInFence && scanResult.safeContent) {
                                        emitTextDelta(scanResult.safeContent);
                                        processedContent = true;
                                    }

                                    if (!processedContent) break;
                                }

                                if (hasToolCalls) break;
                            } // End Read Loop

                            activeStreamReader = null;
                            if (isAborted) return;

                            // Check for leftovers in buffer
                            if (!hasToolCalls && fenceScanner.hasContent()) {
                                emitTextDelta(fenceScanner.getBuffer());
                                fenceScanner.clearBuffer();
                            }

                            // Finalize stream based on what we found
                            if (!hasToolCalls || toolCallsFound.length === 0) {
                                finishStream("stop");
                                return;
                            }

                            if (textBuffer) {
                                emitTextDelta(textBuffer);
                            }

                            finishStream("tool-calls");
                            return;
                        }

                        // Fallback if loop finishes naturally without specific exit
                        if (!hasFinished && !isAborted) {
                            finishStream("other");
                        }
                    } catch (err) {
                        controller.enqueue({ type: "error", error: err });
                        controller.close();
                    } finally {
                        if (callOptions.abortSignal) {
                            callOptions.abortSignal.removeEventListener("abort", handleAbort);
                        }
                    }
                }
            }),
            request: {
                body: { messages: finalMessages, options: promptOptions }
            }
        };
    }
}

export default ChromeAILanguageModel;