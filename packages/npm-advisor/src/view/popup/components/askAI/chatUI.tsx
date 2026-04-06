/**
 * External dependencies.
 */
import React, { type Dispatch, type SetStateAction } from "react";
import {
  ThreadPrimitive,
  ComposerPrimitive,
  useAssistantApi,
} from "@assistant-ui/react";
import { SendHorizontal, AlertCircle } from "lucide-react";
import type { UIMessage } from "ai";
/**
 * Internal dependencies
 */
import { UserMessage } from "./userMessage";
import { AssistantMessage } from "./assistantMessage";

interface ChatUIProps {
  packageName: string;
  apiKeys: { gemini?: string; openai?: string };
  setDisableLock: Dispatch<SetStateAction<boolean>>;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  packageName,
  apiKeys,
  setDisableLock,
}) => {
  const api = useAssistantApi();

  api.on("thread.run-end", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      const currentTabId = currentTab?.id;

      if (!currentTabId) {
        return;
      }

      const currentMessages = api.thread().getState()
        .messages as unknown as UIMessage[];
      chrome.storage.local.get(
        ["messages"],
        (res: { messages: Record<string, UIMessage[]> }) => {
          if (!res.messages) {
            res.messages = {};
          }
          if (!res.messages[currentTabId]) {
            res.messages[currentTabId] = [];
            res.messages[currentTabId].push(...currentMessages);
          } else {
            res.messages[currentTabId] = currentMessages;
          }
          chrome.storage.local.set({ messages: res.messages });
        },
      );
      setDisableLock(false);
    });
  });

  api.on("composer.send", () => {
    setDisableLock(true);
  });

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    }
    window.open(chrome.runtime.getURL("options/options.html"));
  };

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
    <div className="h-full w-full flex flex-col relative bg-slate-50 dark:bg-slate-900">
      <ThreadPrimitive.Root className="h-full flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto w-full p-4 flex flex-col scroll-smooth">
          <ThreadPrimitive.Empty>
            <div className="flex flex-col items-center justify-center text-center px-4 w-full h-full space-y-4 m-auto">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                Ask AI about {packageName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[80%]">
                Hello! I can help you with questions about {packageName}. What
                would you like to know?
              </p>
              <div className="flex flex-wrap gap-2 justify-center w-full mt-6">
                {suggestions.map((s, i) => (
                  <ThreadPrimitive.Suggestion
                    key={i}
                    prompt={s.prompt}
                    className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
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
              UserMessage,
              AssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>

        <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          {!apiKeys.gemini && !apiKeys.openai ? (
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-lg text-xs border border-yellow-200 dark:border-yellow-700 mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>Missing API Key</span>
              </div>
              <button
                onClick={openOptions}
                className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded font-medium transition-colors"
              >
                Configure
              </button>
            </div>
          ) : null}
          <ComposerPrimitive.Root className="flex items-end gap-2 bg-slate-100 dark:bg-slate-700 rounded-xl px-3 py-1.5 border border-slate-200 dark:border-slate-600 focus-within:ring-2 focus-within:ring-[#c94137]/20 focus-within:border-[#c94137] transition-all">
            <ComposerPrimitive.Input
              placeholder="Message AI..."
              className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent outline-none text-[13px] py-2 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-200"
              disabled={!apiKeys.gemini && !apiKeys.openai}
            />
            <ComposerPrimitive.Send className="h-9 w-9 mb-1 flex items-center justify-center rounded-lg bg-[#c94137] hover:bg-[#b03028] text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50">
              <SendHorizontal size={16} />
            </ComposerPrimitive.Send>
          </ComposerPrimitive.Root>
        </div>
      </ThreadPrimitive.Root>
    </div>
  );
};
