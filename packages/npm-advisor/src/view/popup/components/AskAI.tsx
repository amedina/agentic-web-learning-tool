import React from "react";
import { useChat } from "@ai-sdk/react";
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { SendHorizontal } from "lucide-react";

interface AskAIProps {
  packageName: string;
}

export const AskAI: React.FC<AskAIProps> = ({ packageName }) => {
  const chat = useChat({
    api: "/api/chat", // Dummy endpoint
  });

  const runtime = useChatRuntime(chat);

  const suggestions = [
    {
      text: "Suggest better alternatives",
      prompt: `Suggest better alternatives to ${packageName}`,
    },
    {
      text: "Compare with [Popular Library]",
      prompt: `Compare ${packageName} with a popular alternative library`,
    },
    {
      text: "Is there a native JS way?",
      prompt: `Is there a native vanilla JavaScript way to do what ${packageName} does?`,
    },
    {
      text: `Why use this over [X]?`,
      prompt: `Why should I use ${packageName} over other options?`,
    },
  ];

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="h-full w-full flex flex-col relative bg-slate-50">
        <ThreadPrimitive.Root className="h-full flex flex-col">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto w-full p-4 flex flex-col scroll-smooth">
            <ThreadPrimitive.Empty>
              <div className="flex flex-col items-center justify-center text-center px-4 w-full h-full space-y-4 m-auto">
                <h2 className="text-xl font-bold text-slate-800">
                  Ask AI about {packageName}
                </h2>
                <p className="text-sm text-slate-500 max-w-[80%]">
                  Hello! I can help you with questions about {packageName}. What
                  would you like to know?
                </p>
                <div className="flex flex-wrap gap-2 justify-center w-full mt-6">
                  {suggestions.map((s, i) => (
                    <ThreadPrimitive.Suggestion
                      key={i}
                      prompt={s.prompt}
                      className="bg-white border rounded-full px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                      method="replace"
                      autoSend
                    >
                      <span>{s.text}</span>
                    </ThreadPrimitive.Suggestion>
                  ))}
                </div>
              </div>
            </ThreadPrimitive.Empty>

            <ThreadPrimitive.Messages
              components={{
                UserMessage: ({ message }) => {
                  const txt =
                    message.content[0]?.type === "text"
                      ? message.content[0].text
                      : "";
                  return (
                    <div className="flex w-full mb-4 justify-end">
                      <div className="bg-[#c94137] text-white px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm whitespace-pre-wrap break-words">
                        {txt}
                      </div>
                    </div>
                  );
                },
                AssistantMessage: ({ message }) => {
                  const txt =
                    message.content[0]?.type === "text"
                      ? message.content[0].text
                      : "";
                  return (
                    <div className="flex w-full mb-4 justify-start">
                      <div className="bg-white border border-slate-200 text-slate-800 px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm whitespace-pre-wrap break-words leading-relaxed">
                        {txt}
                      </div>
                    </div>
                  );
                },
              }}
            />
          </ThreadPrimitive.Viewport>

          <div className="p-3 bg-white border-t border-slate-200">
            <ComposerPrimitive.Root className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-[#c94137]/20 focus-within:border-[#c94137] transition-all">
              <ComposerPrimitive.Input
                placeholder="Message AI..."
                className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent outline-none text-[13px] py-2 placeholder:text-slate-400 text-slate-800"
              />
              <ComposerPrimitive.Send className="h-9 w-9 mb-1 flex items-center justify-center rounded-lg bg-[#c94137] hover:bg-[#b03028] text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50">
                <SendHorizontal size={16} />
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
};
