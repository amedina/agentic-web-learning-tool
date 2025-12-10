/**
 * External dependencies
 */
import { cn, MarkdownText, ToolFallback } from '@google-awlt/design-system';
import { useAssistantState, MessagePrimitive, ActionBarPrimitive } from "@assistant-ui/react";
import { Root, AvatarFallback } from "@radix-ui/react-avatar";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ClipboardIcon } from "lucide-react";
import type { FC } from "react";

const ChatMessage: FC = () => {
  const role = useAssistantState(({ message }) => message.role);

  return (
    <MessagePrimitive.Root className="relative mx-auto mb-4 flex w-full max-w-screen-md flex-col gap-3">
      <div
        className={cn(
          "relative flex gap-2 rounded-2xl bg-gradient-to-b from-[#21201c] from-50% to-[#1a1915] px-3 py-2.5",
          role === "user" && "self-start",
          role === "assistant" &&
            "bg-[linear-gradient(to_bottom,_hsla(60_1.8%_22%_/_0.75)_0%,_hsla(60_1.8%_22%_/_0)_90%)] pb-4 font-serif",
        )}
      >
        {role === "assistant" && (
          <div className="absolute inset-0 rounded-2xl border-[0.5px] border-[hsla(50_5.8%_40%/0.15)] bg-[radial-gradient(ellipse_at_left_top,_hsla(60_1.8%_22%/0.5)_0%,_hsla(60_1.8%_22%/0.3)_60%)] shadow-[0_4px_24px_rgba(0,0,0,0.015)]" />
        )}
        <div className="relative flex gap-2">
          <MessagePrimitive.If user>
            <Root className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[24px] bg-white">
              <AvatarFallback className="text-xs">
                U
              </AvatarFallback>
            </Root>
          </MessagePrimitive.If>

          <span className="text-[#eee]">
            <MessagePrimitive.Parts components={{ Text: MarkdownText, tools: {Fallback: ToolFallback} }} />
          </span>
        </div>
      </div>

      <MessagePrimitive.If assistant>
        <ActionBarPrimitive.Root
          autohide="not-last"
          className="absolute -bottom-3 mr-3 flex items-center gap-3 self-end rounded-lg border border-[#6c6a6040] bg-[#393937] px-2 py-1"
        >
          <ActionBarPrimitive.Reload className="flex items-center gap-1 font-mono text-xs text-[#b4b4b4] hover:text-white">
            <ReloadIcon width={12} height={12} />
            Retry
          </ActionBarPrimitive.Reload>

          <ActionBarPrimitive.Copy className="flex items-center gap-1 font-mono text-xs text-[#b4b4b4] hover:text-white">
            <ClipboardIcon width={12} height={12} />
            Copy
          </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
};

export default ChatMessage;