/**
 * External dependencies
 */
import { MessagePrimitive, ActionBarPrimitive } from '@assistant-ui/react';
import { CheckIcon, CopyIcon, ReloadIcon } from '@radix-ui/react-icons';
import { Bot } from 'lucide-react';
import type { FC } from 'react';
import { MarkdownText, ToolFallback } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import ActionButton from './actionButton';

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md gap-3">
      <div className="flex flex-col mb-10 w-full group">
        <div className="h-9 w-9 rounded-full bg-background ring-muted-foreground/10 border border-input flex-shrink-0 flex items-center justify-center text-foreground shadow-sm mt-1 ring-4">
          <Bot size={20} />
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-primary">Assistant</span>
            <span className="text-xs text-zinc-400 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
              Just now
            </span>
          </div>
          <div className="text-primary leading-7 text-sm">
            <MessagePrimitive.Parts
              components={{
                Text: MarkdownText,
                tools: { Fallback: ToolFallback },
              }}
            />
          </div>
        </div>
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          autohideFloat="single-branch"
          className="flex items-center gap-1 rounded-lg data-[floating]:absolute data-[floating]:border-2 data-[floating]:p-1"
        >
          <ActionBarPrimitive.Reload asChild>
            <ActionButton tooltip="Reload">
              <ReloadIcon />
            </ActionButton>
          </ActionBarPrimitive.Reload>
          <ActionBarPrimitive.Copy asChild>
            <ActionButton tooltip="Copy">
              <MessagePrimitive.If copied={true}>
                <CheckIcon />
              </MessagePrimitive.If>
              <MessagePrimitive.If copied={false}>
                <CopyIcon />
              </MessagePrimitive.If>
            </ActionButton>
          </ActionBarPrimitive.Copy>
        </ActionBarPrimitive.Root>
      </div>
    </MessagePrimitive.Root>
  );
};

export default AssistantMessage;
