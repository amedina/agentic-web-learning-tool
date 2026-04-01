/**
 * External dependencies.
 */
import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText } from "@google-awlt/design-system";

export const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-start">
        <div className="border px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words leading-relaxed bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
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
