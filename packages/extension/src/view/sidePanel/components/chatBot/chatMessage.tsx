/**
 * External dependencies
 */
import { cn, MarkdownText } from '@google-awlt/design-system';
import { useAssistantState, MessagePrimitive, ActionBarPrimitive } from "@assistant-ui/react";
import { ReloadIcon } from "@radix-ui/react-icons";
import { ClipboardIcon } from "lucide-react";
import type { FC } from "react";

const ChatMessage: FC = () => {
  const role = useAssistantState(({ message }) => message.role);

  return (
    <MessagePrimitive.Root className="relative mx-auto mb-4 flex w-full max-w-screen-md flex-col gap-3">
      <div
        className={cn(
          "relative flex gap-2 rounded-2xl px-3 py-2.5",
          role === "user" && "self-end bg-cream-white",
          role === "assistant" && "pb-4 font-serif self-start",
        )}
      >
        {role === "assistant" && (
          <div className="absolute inset-0 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.015)]" />
        )}
        <div className="relative flex gap-2">
          <span className="text-foreground">
            <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
          </span>
        </div>
      </div>

      <MessagePrimitive.If assistant>
        <ActionBarPrimitive.Root
          autohide="not-last"
          className="absolute -bottom-3 mr-3 flex items-center gap-3 self-end rounded-lg border border-chocolate-dark bg-dark-brown px-2 py-1"
        >
          <ActionBarPrimitive.Reload className="cursor-pointer flex items-center gap-1 font-mono text-xs text-foreground hover:text-ring">
            <ReloadIcon width={12} height={12} />
            Retry
          </ActionBarPrimitive.Reload>

          <ActionBarPrimitive.Copy className="cursor-pointer flex items-center gap-1 font-mono text-xs text-foreground hover:text-ring">
            <ClipboardIcon width={12} height={12} />
            Copy
          </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
};

export default ChatMessage;