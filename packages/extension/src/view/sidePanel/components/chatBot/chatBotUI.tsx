/**
 * External dependencies
 */
import {
  ComposerPrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import { ArrowUpIcon } from "@radix-ui/react-icons";
/**
 * Internal dependencies
 */
import ChatMessage from "./chatMessage";

const ChatBotUI = () => {

  return (
    <ThreadPrimitive.Root className="flex h-full flex-col items-stretch bg-[#2b2a27] px-4 pt-16 font-serif">
      <ThreadPrimitive.Viewport className="no-scrollbar flex flex-grow flex-col overflow-y-scroll">
        <ThreadPrimitive.Messages components={{ Message: ChatMessage }} />
        <ThreadPrimitive.If empty={false}>
          <p className="mx-auto w-full max-w-screen-md p-2 text-right text-xs text-[#b8b5a9]">
            LLM can make mistakes. Please double-check responses.
          </p>
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="mx-auto flex w-full max-w-screen-md flex-col rounded-xl border border-[#6c6a6040] bg-[#393937] p-1.5 m-2">
        <div className="flex">
          <ComposerPrimitive.Input
            placeholder="Reply to Claude..."
            className="h-12 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
          />
          <ComposerPrimitive.Send
            type="submit"
            className="m-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ae5630] text-2xl font-bold disabled:opacity-0"
          >
            <ArrowUpIcon
              width={16}
              height={16}
              className="text-[#ddd] [&_path]:stroke-white [&_path]:stroke-[0.5]"
            />
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </ThreadPrimitive.Root>
  );
};

export default ChatBotUI;