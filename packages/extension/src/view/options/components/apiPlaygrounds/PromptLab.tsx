import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Copy,
  RefreshCw,
  Cpu,
  Loader2,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import {
  Button,
  Collapsible,
  Input,
  Toaster,
  toast,
} from '@google-awlt/design-system';

// Import our custom types
import type { AILanguageModelSession } from '../../../../types/window.ai.d';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export default function PromptLab() {
  // Session State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<AILanguageModelSession | null>(null);

  // Configuration
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are a helpful and friendly assistant.'
  );
  const [temperature, setTemperature] = useState<number>(0.8);
  const [topK, setTopK] = useState<number>(3);

  // Interaction
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // Stats
  const [stats, setStats] = useState({
    maxTokens: 0,
    tokensLeft: 0,
    tokensSoFar: 0,
  });

  // Track which API implementation we are using
  const [apiType, setApiType] = useState<'spec' | 'explainer' | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Polling helper
  const pollForCapabilities = async (attempts: number, delay: number) => {
      let currentAttempt = 0;

      const check = async () => {
          currentAttempt++;
          console.log(`Polling for AI API (Attempt ${currentAttempt}/${attempts})...`);

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
      console.log('Checking AI capabilities...');
      console.log('window.LanguageModel:', window.LanguageModel);
      console.log('window.ai:', (window as any).ai);

      // Prioritize Spec API (self.LanguageModel)
      if (window.LanguageModel) {
          console.log('Using Spec API (LanguageModel)');
          setApiType('spec');
          const LM = window.LanguageModel;
          const availability = await LM.availability();

          if (availability === 'no') {
              throw new Error('LanguageModel is not available (availability="no").');
          }

          // We can also get params here to set defaults
          try {
            const params = await LM.params();
            if (params.defaultTemperature !== undefined) setTemperature(params.defaultTemperature);
            if (params.defaultTopK !== undefined) setTopK(params.defaultTopK);
          } catch (e) {
            console.warn('Failed to get params:', e);
          }

          setError(null);
          // Wait to ensure apiType state is settled or explicitly pass it?
          // Since setState is async, createSession will see old apiType if called immediately.
          // Better to call createSession explicitly with 'spec' type or wait.
          // Let's create session here directly to avoid race condition.
          await createSessionInternal('spec');

      } else {
          // Fallback to Explainer API (window.ai.languageModel)
          const ai = (window as any).ai;
          if (!ai) {
             throw new Error('Chrome Prompt API not found (checked window.LanguageModel and window.ai).');
          }

          let model = ai.languageModel;
          if (!model && ai.prompt) {
             console.log('Using legacy window.ai.prompt');
             model = ai.prompt;
          }

          if (!model) {
             throw new Error('window.ai found, but languageModel/prompt is missing.');
          }

          setApiType('explainer');
          console.log('Using Explainer API (window.ai.languageModel)');

          const capabilities = await model.capabilities();
          if (capabilities.available === 'no') {
              throw new Error('Gemini Nano is reported as not available (available="no").');
          }

          setError(null);
          await createSessionInternal('explainer');
      }

    } catch (err: any) {
      console.error('Capabilities check failed:', err);
      setError(err.message);
    }
  };

  const createSession = async () => {
      // Wrapper for UI button click which relies on state
      if (!apiType) return;
      await createSessionInternal(apiType);
  };

  const createSessionInternal = async (type: 'spec' | 'explainer') => {
    if (session) {
      session.destroy();
    }

    setIsLoading(true);
    try {
      let newSession;
      const options = {
        temperature,
        topK,
        initialPrompts: systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : undefined
      };

      if (type === 'spec') {
         if (!window.LanguageModel) throw new Error('LanguageModel API lost.');
         newSession = await window.LanguageModel.create(options);
      } else {
         const ai = (window as any).ai;
         const model = ai.languageModel || ai.prompt;
         if (!model) throw new Error('Model API not found');
         newSession = await model.create(options);
      }

      setSession(newSession);
      updateStats(newSession);
      setMessages([]);

      // Add system message to UI for visibility
      setMessages([{
        role: 'system',
        content: systemPrompt,
        timestamp: Date.now()
      }]);

      toast.success('Session Created', {
        description: `Temp: ${temperature}, TopK: ${topK}`,
      });
    } catch (err: any) {
      console.error('Failed to create session:', err);
      toast.error('Session Error', {
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
      toast.success('Session Destroyed', {
        description: 'Memory has been freed.',
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
      toast.success('Session Cloned', {
        description: 'Conversation state preserved.',
      });
    } catch (err: any) {
      toast.error('Clone Failed', {
        description: err.message,
      });
    }
  };

  const updateStats = (currentSession: AILanguageModelSession) => {
    setStats({
      maxTokens: currentSession.maxTokens || currentSession.inputQuota || 0,
      tokensLeft: currentSession.tokensLeft || ((currentSession.inputQuota || 0) - (currentSession.inputUsage || 0)) || 0,
      tokensSoFar: currentSession.tokensSoFar || currentSession.inputUsage || 0,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !session || isStreaming) return;

    const userMsg: Message = { role: 'user', content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const stream = await session.promptStreaming(input);

      const assistantMsg: Message = { role: 'assistant', content: '', timestamp: Date.now() };
      setMessages((prev) => [...prev, assistantMsg]);

      let fullResponse = '';
      let previousChunk = '';

      for await (const chunk of stream) {
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk;

        fullResponse += newChunk;
        previousChunk = chunk;

        setMessages((prev) => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = fullResponse;
          }
          return newHistory;
        });
      }

      updateStats(session);

    } catch (err: any) {
      console.error('Prompt error:', err);
      toast.error('Generation Error', {
        description: err.message,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: `*Error: ${err.message}*`, timestamp: Date.now() }]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center p-6 space-y-4 bg-destructive/10 rounded-xl border border-destructive/20">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h3 className="text-xl font-semibold text-destructive">Component Unavailable</h3>
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
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] gap-6">
      <Toaster />

      {/* Top Controls / Config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
               <label className="text-xs font-medium text-muted-foreground">System Prompt</label>
               <textarea
                 className="w-full h-24 p-2 text-sm bg-background border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                 value={systemPrompt}
                 onChange={(e) => setSystemPrompt(e.target.value)}
                 placeholder="Define the AI's persona..."
               />
            </div>

            <Collapsible
               title="Parameters"
               defaultOpen={true}
            >
              <div className="space-y-4 pt-2">
                 <div className="space-y-1">
                   <div className="flex justify-between text-xs">
                     <span>Temperature</span>
                     <span className="font-mono text-muted-foreground">{temperature.toFixed(1)}</span>
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
                     <span className="font-mono text-muted-foreground">{topK}</span>
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
                 {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <RefreshCw className="w-3 h-3 mr-2"/>}
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
                     style={{ width: `${(stats.tokensSoFar / (stats.maxTokens || 1)) * 100}%` }}
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
                 <Copy className="w-3 h-3 mr-2"/> Clone
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 className="flex-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                 onClick={destroySession}
                 disabled={!session}
               >
                 <Trash2 className="w-3 h-3 mr-2"/> Destroy
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
          >
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <TerminalIcon />
                <p className="mt-2 text-sm">Start a conversation to see output here.</p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : msg.role === 'system'
                      ? 'bg-muted text-muted-foreground text-xs font-mono w-full text-center'
                      : 'bg-muted/50'
                  }`}
                >
                  {msg.role === 'system' ? (
                     <span>System: {msg.content}</span>
                  ) : (
                     <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
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

function TerminalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  );
}
