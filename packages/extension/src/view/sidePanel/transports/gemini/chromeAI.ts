import type { AssistantRuntime } from "@assistant-ui/react";


import { ToolCallParser } from "./utils/toolCallParser";
import { extractArguments, convertMessages, extractToolCall, extractToolCalls, extractToolName, mergeSystemAndMessages } from "./utils";
import type { ToolCallRequest } from "../../types";

/**
 * Implementation of the LanguageModelV1 interface for Chrome's built-in Prompt API.
 */
class ChromeAILanguageModel {
    private session: LanguageModelSession | null = null;
    private runtime: AssistantRuntime | null = null;
    private formattedTools: any[] = [];
    specificationVersion;
    provider;
    supportedUrls;
    modelId;
    config;

    setRuntime(runtime: AssistantRuntime) {
        this.runtime = runtime
    }

    constructor(modelId: string, options = {}) {
        this.specificationVersion = "v2";
        this.provider = "browser-ai";

        // Defines supported media types (images/audio) via URL patterns
        this.supportedUrls = {
            "image/*": [/^https?:\/\/.+$/],
            "audio/*": [/^https?:\/\/.+$/]
        };

        this.modelId = modelId;
        this.config = {
            provider: this.provider,
            modelId: modelId,
            options: options
        };
    }

    async getSession() {
        if (!this.runtime || this.session) {
            return;
        }

        const lm = window.LanguageModel;
        const { tools } = this.runtime.thread.getModelContext();

        this.formattedTools = Object.entries(tools ?? []).map(([key, value]) => [key, {
            description: value.description,
            inputSchema: value.parameters,
            execute: value.execute,
            name: key,
            type: "function"
        }]);
        //@ts-expect-error -- already checked in initialize session
        this.session = await lm.create({});
    }

    /**
     * Prepares arguments, validates settings, and formats tools for the Prompt API.
     */
    //@ts-expect-error -- api is not widely available
    getArgs(args) {
        const {
            temperature,
            topK,
            responseFormat,
            tools,
            prompt
        } = args;

        // Filter tools: 'mx' checks if it is a function tool
        const functionTools = (tools ?? []).filter((tool: ToolCallRequest) => tool.type === 'function');

        const promptOptions = {};

        if (responseFormat?.type === "json") {
            //@ts-expect-error -- api is not widely available
            promptOptions.responseConstraint = responseFormat.schema;
        }

        if (temperature !== undefined){
            //@ts-expect-error -- api is not widely available
            promptOptions.temperature = temperature;
        }
        if (topK !== undefined){
            //@ts-expect-error -- api is not widely available
            promptOptions.topK = topK;
        }

        const { systemMessage, messages } = convertMessages(prompt);

        return {
            promptOptions,
            expectedInputs: undefined,
            functionTools,
            systemMessage,
            messages
        };
    }

    /**
     * Handles non-streaming generation.
     */
    //@ts-expect-error -- api is not widely available
    async doGenerate(callOptions) {
        const args = this.getArgs(callOptions);
        const {
            promptOptions,
            messages
        } = args;

        if (!this.session) {
            await this.getSession();
        }

        const systemMessage = `
            You are the WebMCP Browsing Agent. Investigate pages, gather context, and guide the user through the browser using Model Context Protocol tools.\n\nBehavior\n• Operate entirely through the provided MCP tools—never assume page state without verifying.\n• Narrate intentions before acting and summarize findings after each tool call.\n• Prefer lightweight inspection (history, tabs, DOM extraction) before triggering heavier actions.\n\nWorkflow\n1. Confirm your objective and current tab context.\n2. Use tab & navigation tools to open or focus the right page.\n3. Extract structured information (dom_extract_*, screenshot, requestInput) instead of guessing.\n4. Record observations and recommend next steps; ask for confirmation before irreversible actions.\n\nSafety\n• Stay within the active browsing session; do not attempt filesystem access or userscript management.\n• Surface uncertainties clearly and request clarification when instructions conflict or lack detail.\n\nYou are a helpful AI assistant with access to tools.# Available Tools\n
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
            `

        const finalMessages = mergeSystemAndMessages(messages, systemMessage);

        // Execute prompt
        const responseText = await this.session.prompt([...finalMessages], promptOptions);

        const { toolCall: toolCalls, textPrefix: textContent } = extractToolCall(responseText);

        // If tool calls were found
        if (toolCalls && toolCalls.length > 0) {

            const firstBatch = toolCalls.slice(0, 1);
            const content = [];

            if (textContent) {
                content.push({
                    type: "text",
                    text: textContent
                });
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
                usage: {
                    inputTokens: undefined,
                    outputTokens: undefined,
                    totalTokens: undefined
                },
                request: {
                    body: { messages: finalMessages, options: promptOptions }
                },
            };
        }

        return {
            content: [{ type: "text", text: textContent || responseText }],
            finishReason: "stop",
            usage: {
                inputTokens: undefined,
                outputTokens: undefined,
                totalTokens: undefined
            },
            request: {
                body: { messages: finalMessages, options: promptOptions }
            },
        };
    }

    /**
     * Handles streaming generation.
     */
    //@ts-expect-error -- api is not widely available
    async doStream(callOptions) {
        const args = this.getArgs(callOptions);
        const {
            messages,
            promptOptions,
        } = args;

        if (!this.session) {
            await this.getSession();
        }

        if (this.formattedTools.length === 0) {
            return;
        }

        const systemMessage = `
            You are the WebMCP Browsing Agent. Investigate pages, gather context, and guide the user through the browser using Model Context Protocol tools.\n\nBehavior\n• Operate entirely through the provided MCP tools—never assume page state without verifying.\n• Narrate intentions before acting and summarize findings after each tool call.\n• Prefer lightweight inspection (history, tabs, DOM extraction) before triggering heavier actions.\n\nWorkflow\n1. Confirm your objective and current tab context.\n2. Use tab & navigation tools to open or focus the right page.\n3. Extract structured information (dom_extract_*, screenshot, requestInput) instead of guessing.\n4. Record observations and recommend next steps; ask for confirmation before irreversible actions.\n\nSafety\n• Stay within the active browsing session; do not attempt filesystem access or userscript management.\n• Surface uncertainties clearly and request clarification when instructions conflict or lack detail.\n\nYou are a helpful AI assistant with access to tools.# Available Tools\n
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
            `

        const finalMessages = mergeSystemAndMessages(messages, systemMessage);
        // The Chrome Prompt API requires the full message history for every call
        const messageContext: {
            role: string;
            content: any;
        }[] = [...finalMessages];
        const textPartId = "text-0";

        return {
            stream: new ReadableStream({
                start: async (controller) => {
                    // 1. Emit initial warnings
                    controller.enqueue({
                        type: "stream-start",
                    });

                    // State tracking variables
                    let hasStartedText = false;
                    let hasFinished = false;
                    let isAborted = false;
                    //@ts-expect-error -- api is not widely available
                    let activeStreamReader = null;

                    // Helper to emit text start event
                    const emitTextStart = () => {
                        if (!hasStartedText) {
                            controller.enqueue({ type: "text-start", id: textPartId });
                            hasStartedText = true;
                        }
                    };

                    // Helper to emit text delta
                    const emitTextDelta = (delta: string) => {
                        if (delta) {
                            emitTextStart();
                            controller.enqueue({
                                type: "text-delta",
                                id: textPartId,
                                delta: delta
                            });
                        }
                    };

                    // Helper to emit text end
                    const emitTextEnd = () => {
                        if (hasStartedText) {
                            controller.enqueue({ type: "text-end", id: textPartId });
                            hasStartedText = false;
                        }
                    };

                    // Helper to finalize stream
                    const finishStream = (reason: string) => {
                        if (!hasFinished) {
                            hasFinished = true;
                            emitTextEnd();
                            controller.enqueue({
                                type: "finish",
                                finishReason: reason,
                                usage: {
                                    outputTokens: undefined,
                                    totalTokens: undefined
                                }
                            });
                            controller.close();
                        }
                    };

                    const handleAbort = () => {
                        if (!isAborted) {
                            isAborted = true;
                            //@ts-expect-error -- api is not widely available
                            if (activeStreamReader) {
                                activeStreamReader.cancel().catch(() => { });
                            }
                            finishStream("stop");
                        }
                    };

                    if (callOptions.abortSignal) {
                        callOptions.abortSignal.addEventListener("abort", handleAbort);
                    }
                    const MAX_LOOPS = 10;
                    let loopCount = 0;
                    try {
                        const fenceScanner = new ToolCallParser();

                        while (loopCount < MAX_LOOPS && !isAborted && !hasFinished) {
                            loopCount += 1;
                            if (!this.session) {
                                finishStream("stop");
                                return;
                            }
                            //@ts-expect-error -- api is not widely available
                            activeStreamReader = this.session.promptStreaming(messageContext).getReader();

                            let toolCallsFound = [];
                            let hasToolCalls = false;
                            let textBuffer = "";
                            let currentToolCallId = null;
                            let hasEmittedToolStart = false;
                            let rawToolBuffer = ""; // Accumulates JSON for tool args
                            let processedArgLength = 0;
                            let isInFence = false;

                            while (!isAborted) {
                                const { done, value: chunk } = await activeStreamReader.read();
                                if (done) {
                                    break;
                                }

                                // Add chunk to fence scanner to detect tool blocks
                                fenceScanner.addChunk(chunk);

                                while (fenceScanner.hasContent()) {
                                    const wasInFence = isInFence;
                                    const scanResult = fenceScanner.detectStreamingFence();
                                    isInFence = scanResult.inFence;

                                    let processedContent = false;

                                    if (!wasInFence && scanResult.inFence) {
                                        if (scanResult.safeContent) {
                                            emitTextDelta(scanResult.safeContent);
                                            processedContent = true;
                                        }
                                        // Generate ID for potential tool call
                                        currentToolCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
                                        hasEmittedToolStart = false;
                                        rawToolBuffer = "";
                                        processedArgLength = 0;
                                        isInFence = true;
                                        continue;
                                    }


                                    if (scanResult.completeFence) {
                                        processedContent = true;
                                        if (scanResult.safeContent) {
                                            rawToolBuffer += scanResult.safeContent;
                                        }

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

                                        const parsedCalls = extractToolCalls(scanResult.completeFence).toolCalls.slice(0, 1);

                                        if (parsedCalls.length === 0) {
                                            // False alarm, was just code block
                                            toolCallsFound = [];
                                            hasToolCalls = false;
                                            emitTextDelta(scanResult.completeFence);
                                            if (scanResult.textAfterFence) {
                                                emitTextDelta(scanResult.textAfterFence);
                                            }
                                            // Reset state
                                            currentToolCallId = null;
                                            hasEmittedToolStart = false;
                                            rawToolBuffer = "";
                                            processedArgLength = 0;
                                            isInFence = false;
                                            continue;
                                        }

                                        if (parsedCalls.length > 0 && currentToolCallId) {
                                            parsedCalls[0].toolCallId = currentToolCallId;
                                        }

                                        toolCallsFound = parsedCalls;
                                        hasToolCalls = toolCallsFound.length > 0;

                                        for (const [idx, tool] of toolCallsFound.entries()) {
                                            const callId: string = (idx === 0 && currentToolCallId) ? currentToolCallId : tool.toolCallId;
                                            const name = tool.toolName;
                                            const argsString = JSON.stringify(tool.args ?? {});

                                            if (callId === currentToolCallId) {
                                                if (!hasEmittedToolStart) {
                                                    controller.enqueue({
                                                        type: "tool-input-start",
                                                        id: callId,
                                                        toolName: name
                                                    });
                                                    hasEmittedToolStart = true;
                                                }
                                                // Ensure args are synced
                                                const currentArgs = extractArguments(rawToolBuffer);
                                                if (currentArgs.length > processedArgLength) {
                                                    const diff = currentArgs.slice(processedArgLength);
                                                    processedArgLength = currentArgs.length;
                                                    if (diff.length > 0) {
                                                        controller.enqueue({
                                                            type: "tool-input-delta",
                                                            id: callId,
                                                            delta: diff
                                                        });
                                                    }
                                                }
                                            } else {
                                                // Secondary calls in same block (rare)
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

                                        // Stop streaming text if we found a tool
                                        if (hasToolCalls && activeStreamReader) {
                                            await activeStreamReader.cancel().catch(() => { });
                                            break; // Break the inner loop
                                        }

                                        // Reset state
                                        currentToolCallId = null;
                                        hasEmittedToolStart = false;
                                        rawToolBuffer = "";
                                        processedArgLength = 0;
                                        isInFence = false;
                                        continue;
                                    }

                                    // 3. Inside a fence (streaming tool args)
                                    if (isInFence) {
                                        if (scanResult.safeContent) {
                                            rawToolBuffer += scanResult.safeContent;
                                            processedContent = true;

                                            const extractedName = extractToolName(rawToolBuffer);
                                            if (extractedName && !hasEmittedToolStart && currentToolCallId) {
                                                controller.enqueue({
                                                    type: "tool-input-start",
                                                    id: currentToolCallId,
                                                    toolName: extractedName
                                                });
                                                hasEmittedToolStart = true;
                                            }

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

                                    if (!isInFence && scanResult.safeContent) {
                                        emitTextDelta(scanResult.safeContent);
                                        processedContent = true;
                                    }

                                    if (!processedContent){
                                        break;
                                    }
                                }

                                if (hasToolCalls) {
                                    break;
                                }
                            }

                            activeStreamReader = null;
                            if (isAborted) {
                                return;
                            }

                            if (!hasToolCalls && fenceScanner.hasContent()) {
                                emitTextDelta(fenceScanner.getBuffer());
                                fenceScanner.clearBuffer();
                            }

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