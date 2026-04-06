/**
 * External dependencies.
 */
import { MessagePrimitive } from "@assistant-ui/react";
import { MarkdownText, ToolFallback } from "@google-awlt/design-system";
/**
 * Internal dependencies.
 */
import { Reasoning, ReasoningGroup } from "./reasoning";

export const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-start">
        <div className="px-4 py-2 rounded-2xl max-w-[85%] text-[13px] break-words leading-relaxed bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownText,
              Reasoning,
              ReasoningGroup,
              tools: { Fallback: ToolFallback },
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
