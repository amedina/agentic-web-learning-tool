/**
 * External dependencies.
 */
import { MessagePrimitive, useAssistantApi } from "@assistant-ui/react";
import { MarkdownText } from "@google-awlt/design-system";
import type { UIMessage } from "ai";

export const AssistantMessage = () => {
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
    });
  });
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-start">
        <div className="border px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words leading-relaxed bg-white border-slate-200 text-slate-800">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
