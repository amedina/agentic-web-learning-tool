/**
 * External dependencies.
 */
import React from "react";
import { ThreadPrimitive, ComposerPrimitive } from "@assistant-ui/react";
import { SendHorizontal, AlertCircle } from "lucide-react";
/**
 * Internal dependencies
 */
import { UserMessage } from "./userMessage";
import { AssistantMessage } from "./assistantMessage";

interface ChatUIProps {
  apiKeys: { gemini?: string; openai?: string };
  changeTabToSettings: () => void;
}

export const ChatUI: React.FC<ChatUIProps> = ({
  apiKeys,
  changeTabToSettings,
}) => {
  return (
    <div className="h-full w-full flex flex-col relative bg-slate-50">
      <ThreadPrimitive.Root className="h-full flex flex-col">
        <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto w-full p-4 flex flex-col scroll-smooth">
          <ThreadPrimitive.Empty>
            <div className="flex flex-col items-center justify-center text-center px-4 w-full h-full space-y-4 m-auto">
              <h2 className="text-xl font-bold text-slate-800">
                Ask AI about comparison
              </h2>
              <p className="text-sm text-slate-500 max-w-[80%]">
                Hello! I can help you with questions about package comparison.
                What would you like to know?
              </p>
            </div>
          </ThreadPrimitive.Empty>

          <ThreadPrimitive.Messages
            components={{
              UserMessage,
              AssistantMessage,
            }}
          />
        </ThreadPrimitive.Viewport>

        <div className="p-3 bg-white border-t border-slate-200">
          {!apiKeys.gemini && !apiKeys.openai ? (
            <div className="flex items-center justify-between p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-200 mb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle size={16} />
                <span>Missing API Key</span>
              </div>
              <button
                onClick={changeTabToSettings}
                className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded font-medium transition-colors"
              >
                Configure
              </button>
            </div>
          ) : null}
          <ComposerPrimitive.Root className="flex items-end gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 focus-within:ring-2 focus-within:ring-[#c94137]/20 focus-within:border-[#c94137] transition-all">
            <ComposerPrimitive.Input
              placeholder="Message AI..."
              className="flex-1 max-h-32 min-h-[36px] resize-none bg-transparent outline-none text-[13px] py-2 placeholder:text-slate-400 text-slate-800"
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
