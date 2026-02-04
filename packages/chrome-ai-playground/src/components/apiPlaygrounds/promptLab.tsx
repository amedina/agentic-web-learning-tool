/**
 * External dependencies
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Trash2,
  Copy,
  RefreshCw,
  Cpu,
  Loader2,
  AlertCircle,
  Settings2,
  RotateCcw,
} from "lucide-react";
import { Button, Collapsible, Input, toast } from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import { useDebounce } from "../../hooks/useDebounce";
import TerminalIcon from "../icons/terminalIcon";
import type { AILanguageModelSession } from "../../types/window";

interface TokenUsage {
  used: number;
  total: number;
  remaining: number;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  tokenUsage?: TokenUsage;
}

const DEFAULT_SYSTEM_PROMPT = "You are a helpful and friendly assistant.";

export default function PromptLab() {
  // Session State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AILanguageModelSession | null>(null);

  // Configuration
  const [systemPrompt, setSystemPrompt] = useState<string>(() => {
    return (
      sessionStorage.getItem("promptLabSystemPrompt") || DEFAULT_SYSTEM_PROMPT
    );
  });
  const debouncedSystemPrompt = useDebounce(systemPrompt, 1000);

  const [temperature, setTemperature] = useState<number>(0.8);
  const [topK, setTopK] = useState<number>(3);

  // Interaction
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState({
    maxTokens: 0,
    tokensLeft: 0,
    tokensSoFar: 0,
  });

  // Track which API implementation we are using
  const [apiType, setApiType] = useState<"spec" | "explainer" | null>(null);

  // Refs for tracking auto-scroll behavior
  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // Track initial session creation to prevent double toast
  const initialSessionCreated = useRef(false);

  // Initialize
  useEffect(() => {
    // Start checking for capabilities with polling
    pollForCapabilities(5, 1000); // 5 attempts, 1s interval

    return () => {
      if (session) {
        session.destroy();
      }
    };
  }, []);

  // Persist system prompt
  useEffect(() => {
    sessionStorage.setItem("promptLabSystemPrompt", systemPrompt);
  }, [systemPrompt]);

  // Handle system prompt updates (Silent Reload)
  useEffect(() => {
    if (session && !isLoading && !isStreaming && apiType) {
      // Recreate session with new system prompt, preserving history
      createSessionInternal(apiType, true);
    }
  }, [debouncedSystemPrompt]);

  // Handle Scroll to toggle auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // If user is near bottom (within 50px), enable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    shouldAutoScrollRef.current = isNearBottom;
  };

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current && shouldAutoScrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Polling helper
  const pollForCapabilities = async (attempts: number, delay: number) => {
    let currentAttempt = 0;

    const check = async () => {
      currentAttempt++;
      console.log(
        `Polling for AI API (Attempt ${currentAttempt}/${attempts})...`,
      );

      try {
        if (window.LanguageModel || (window as any).ai) {
          await checkCapabilities();
          return; // Success
        }

        if (currentAttempt < attempts) {
          setTimeout(check, delay);
        } else {
          // Final attempt failed, trigger error by running checkCapabilities one last time
          await checkCapabilities();
        }
      } catch (e) {
        // If checkCapabilities throws, it sets the error state
      }
    };

    check();
  };

  const checkCapabilities = async () => {
    try {
      // Debug logging to see what's available
      console.log("Checking AI capabilities...");
      console.log("window.LanguageModel:", window.LanguageModel);
      console.log("window.ai:", (window as any).ai);

      // Prioritize Spec API (self.LanguageModel)
      if (window.LanguageModel) {
        console.log("Using Spec API (LanguageModel)");
        setApiType("spec");
        const LM = window.LanguageModel;
        const availability = await LM.availability();

        if (availability === "no") {
          throw new Error(
            'LanguageModel is not available (availability="no").',
          );
        }

        // We can also get params here to set defaults
        try {
          const params = await LM.params();
          if (params.defaultTemperature !== undefined)
            setTemperature(params.defaultTemperature);
          if (params.defaultTopK !== undefined) setTopK(params.defaultTopK);
        } catch (e) {
          console.warn("Failed to get params:", e);
        }

        setError(null);
        await createSessionInternal("spec");
      } else {
        // Fallback to Explainer API (window.ai.languageModel)
        const ai = (window as any).ai;
        if (!ai) {
          throw new Error(
            "Chrome Prompt API not found (checked window.LanguageModel and window.ai).",
          );
        }

        let model = ai.languageModel;
        if (!model && ai.prompt) {
          console.log("Using legacy window.ai.prompt");
          model = ai.prompt;
        }

        if (!model) {
          throw new Error(
            "window.ai found, but languageModel/prompt is missing.",
          );
        }

        setApiType("explainer");
        console.log("Using Explainer API (window.ai.languageModel)");

        const capabilities = await model.capabilities();
        if (capabilities.available === "no") {
          throw new Error(
            'Gemini Nano is reported as not available (available="no").',
          );
        }

        setError(null);
        await createSessionInternal("explainer");
      }
    } catch (err: any) {
      console.error("Capabilities check failed:", err);
      setError(err.message);
    }
  };

  const createSession = async () => {
    // Wrapper for UI button click which relies on state
    if (!apiType) return;
    await createSessionInternal(apiType, false, true);
  };

  const createSessionInternal = async (
    type: "spec" | "explainer",
    preserveHistory: boolean = false,
    manualTrigger: boolean = false,
  ) => {
    if (session) {
      session.destroy();
    }

    setIsLoading(true);
    try {
      let newSession;
      const options = {
        temperature,
        topK,
        initialPrompts: systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }]
          : undefined,
      };

      if (type === "spec") {
        if (!window.LanguageModel) throw new Error("LanguageModel API lost.");
        newSession = await window.LanguageModel.create(options);
      } else {
        const ai = (window as any).ai;
        const model = ai.languageModel || ai.prompt;
        if (!model) throw new Error("Model API not found");
        newSession = await model.create(options);
      }

      setSession(newSession);
      updateStats(newSession);

      if (!preserveHistory) {
        setMessages([]);
        // Add system message to UI for visibility
        setMessages([
          {
            role: "system",
            content: systemPrompt,
            timestamp: Date.now(),
          },
        ]);

        if (manualTrigger || !initialSessionCreated.current) {
          toast.success("Prompt API Session Initialized", {
            description: `Temp: ${temperature}, TopK: ${topK}`,
          });
          initialSessionCreated.current = true;
        }
      } else {
        // Update the displayed system prompt if it exists in history
        setMessages((prev) => {
          const newMsgs = [...prev];
          // Assuming first message is system
          if (newMsgs.length > 0 && newMsgs[0].role === "system") {
            newMsgs[0] = { ...newMsgs[0], content: systemPrompt };
          }
          return newMsgs;
        });
        toast.success("System Prompt Updated", {
          description: "Session reloaded with new system instructions.",
        });
      }
    } catch (err: any) {
      console.error("Failed to create session:", err);
      toast.error("Session Error", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const destroySession = () => {
    if (session) {
      session.destroy();
      setSession(null);
      setMessages([]);
      setStats({ maxTokens: 0, tokensLeft: 0, tokensSoFar: 0 });
      toast.success("Session Destroyed", {
        description: "Session destroyed and memory freed.",
      });
    }
  };

  const cloneSession = async () => {
    if (!session) return;
    try {
      const newSession = await session.clone();
      session.destroy();
      setSession(newSession);
      updateStats(newSession);
      toast.success("Session Context Cloned", {
        description: "Session context successfully duplicated.",
      });
    } catch (err: any) {
      toast.error("Clone Failed", {
        description: err.message,
      });
    }
  };

  const updateStats = (currentSession: AILanguageModelSession) => {
    setStats({
      maxTokens: currentSession.maxTokens || currentSession.inputQuota || 0,
      tokensLeft:
        currentSession.tokensLeft ||
        (currentSession.inputQuota || 0) - (currentSession.inputUsage || 0) ||
        0,
      tokensSoFar: currentSession.tokensSoFar || currentSession.inputUsage || 0,
    });
  };

  const resetSystemPrompt = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    toast.info("System Prompt Reset");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !session || isStreaming) return;

    // Reset auto-scroll to true when user sends a new message
    shouldAutoScrollRef.current = true;

    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    // Capture tokens before generation
    const startTokens = session.tokensSoFar || session.inputUsage || 0;

    try {
      const stream = await session.promptStreaming(input);

      const assistantMsg: Message = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      let fullResponse = "";
      let previousChunk = "";

      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;

        fullResponse += newChunk;
        previousChunk = chunk;

        setMessages((prev) => {
          const newHistory = [...prev];
          const lastIdx = newHistory.length - 1;
          const lastMsg = newHistory[lastIdx];
          if (lastMsg.role === "assistant") {
            newHistory[lastIdx] = { ...lastMsg, content: fullResponse };
          }
          return newHistory;
        });
      }

      // Update stats and calculate usage
      updateStats(session);
      const endTokens = session.tokensSoFar || session.inputUsage || 0;

      const used = endTokens - startTokens;
      const remaining =
        session.tokensLeft ||
        (session.inputQuota || 0) - (session.inputUsage || 0) ||
        0;
      const total = session.maxTokens || session.inputQuota || 0;

      setMessages((prev) => {
        const newHistory = [...prev];
        const lastIdx = newHistory.length - 1;
        const lastMsg = newHistory[lastIdx];
        if (lastMsg.role === "assistant") {
          newHistory[lastIdx] = {
            ...lastMsg,
            tokenUsage: { used, total, remaining },
          };
        }
        return newHistory;
      });
    } catch (err: any) {
      console.error("Prompt error:", err);
      toast.error("Generation Error", {
        description: err.message,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `*Error: ${err.message}*`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 space-y-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h3 className="text-xl font-semibold text-destructive">
          Component Unavailable
        </h3>
        <p className="text-muted-foreground max-w-md">{error}</p>
        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
          Check console for details.
        </div>
        <div className="flex gap-2">
          <Button onClick={() => pollForCapabilities(5, 500)} variant="outline">
            <RefreshCw className="w-3 h-3 mr-2" /> Retry Check
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] gap-6 w-full">
      {/* Top Controls / Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Prompt & Config */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-card border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Configuration
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-muted-foreground">
                  System Prompt
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={resetSystemPrompt}
                  title="Reset System Prompt"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
              <textarea
                className="w-full h-24 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Define system instructions / persona..."
              />
            </div>

            <Collapsible title="Parameters" defaultOpen={true}>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Temperature</span>
                    <span className="font-mono text-muted-foreground">
                      {temperature.toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Top K</span>
                    <span className="font-mono text-muted-foreground">
                      {topK}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="128"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(parseInt(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </Collapsible>

            <div className="pt-2 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={createSession}
                disabled={isLoading || !apiType}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-2" />
                )}
                New Session
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-card border rounded-xl p-4 space-y-3">
            <h3 className="font-medium flex items-center gap-2 text-sm">
              <Cpu className="w-4 h-4" />
              Session Stats
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 p-2 rounded">
                <p className="text-muted-foreground">Context Window</p>
                <p className="font-mono font-medium">{stats.maxTokens}</p>
              </div>
              <div className="bg-muted/50 p-2 rounded">
                <p className="text-muted-foreground">Tokens Used</p>
                <p className="font-mono font-medium">{stats.tokensSoFar}</p>
              </div>
              <div className="col-span-2 bg-muted/50 p-2 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-mono">{stats.tokensLeft} left</span>
                </div>
                <div className="w-full bg-background h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(stats.tokensSoFar / (stats.maxTokens || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
                onClick={cloneSession}
                disabled={!session}
              >
                <Copy className="w-3 h-3 mr-2" /> Clone
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={destroySession}
                disabled={!session}
              >
                <Trash2 className="w-3 h-3 mr-2" /> Destroy
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="md:col-span-2 flex flex-col bg-card border rounded-xl overflow-hidden h-full min-h-[500px]">
          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={handleScroll}
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <TerminalIcon />
                <p className="mt-2 text-sm">
                  Start a conversation to see output here.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : msg.role === "system"
                        ? "bg-muted text-muted-foreground text-xs font-mono w-full text-center"
                        : "bg-muted/50"
                  }`}
                >
                  {msg.role === "system" ? (
                    <span>System: {msg.content}</span>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
                {msg.tokenUsage && (
                  <div className="text-[10px] text-muted-foreground mt-1 px-1">
                    Used: {msg.tokenUsage.used} | Remaining:{" "}
                    {msg.tokenUsage.remaining}
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-muted/50 rounded-lg p-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                disabled={!session || isStreaming}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={!input.trim() || !session || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
