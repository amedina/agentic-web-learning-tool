/**
 * External dependencies.
 */
import { MessagePrimitive } from "@assistant-ui/react";

/**
 * Internal dependencies.
 */
import { MarkdownMessageText } from "../../../shared/markdownMessageText";

export const AssistantMessage = () => {
  return (
    <MessagePrimitive.Root>
      <div className="flex w-full mb-4 justify-start">
        <div className="overflow-x-auto border px-4 py-2 rounded-2xl max-w-[85%] text-[13px] shadow-sm break-words leading-relaxed bg-white border-slate-200 text-slate-800">
          <MessagePrimitive.Parts
            components={{
              Text: MarkdownMessageText,
            }}
          />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};
