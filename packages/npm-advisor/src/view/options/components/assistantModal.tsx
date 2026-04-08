/**
 * External dependencies
 */
import { BotIcon, ChevronDownIcon } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { AssistantModalPrimitive } from "@assistant-ui/react";
import { TooltipIconButton } from "@google-awlt/design-system";
import { PropProvider, SidepanelChatbot } from "@google-awlt/chatbot";
/**
 * Internal dependencies
 */
import { AssistantMessage } from "./assistantMessage";
import { getSystemPrompt } from "./getSystemPrompt";
import { UserMessage } from "./userMessage";

interface AssistantModalProps {
  comparisonBucket: any[];
}

export const AssistantModal = ({ comparisonBucket }: AssistantModalProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, []);

  return (
    <AssistantModalPrimitive.Root open={open}>
      <AssistantModalPrimitive.Anchor className="aui-root aui-modal-anchor fixed right-4 bottom-4 size-11">
        <AssistantModalPrimitive.Trigger asChild onClick={() => setOpen(!open)}>
          <AssistantModalButton data-state={open ? "open" : "closed"} />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        sideOffset={16}
        style={{
          height: "calc(var(--radix-popper-available-height) - 20px)",
        }}
        className="border border-slate-200 aui-root aui-modal-content data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:slide-out-to-right-1/2 data-[state=closed]:zoom-out data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-right-1/2 data-[state=open]:zoom-in z-50 h-125 w-100 overflow-clip overscroll-contain rounded-xl shadow-[0_10px_38px_-10px_rgba(22,23,24,0.35),0_10px_20px_-15px_rgba(22,23,24,0.2)] bg-popover p-0 text-popover-foreground shadow-md outline-none data-[state=closed]:animate-out data-[state=open]:animate-in [&>.aui-thread-root]:bg-inherit [&>.aui-thread-root_.aui-thread-viewport-footer]:bg-inherit"
      >
        <PropProvider
          allowToolCalling={false}
          customIcon={
            <img
              src="/icons/icon.png"
              alt="NPM Advisor Logo"
              className="w-[42px] h-[42px] rounded shrink-0 object-contain shadow-sm bg-white p-1"
            />
          }
          footerNode={<></>}
          assistantMessage={AssistantMessage}
          userMessage={UserMessage}
          getCustomSystemPrompt={() => {
            return getSystemPrompt(JSON.stringify(comparisonBucket, null, 2));
          }}
          allowChatStorage={false}
          isOptionsPage={true}
          helperTextSet={{
            title: () => `Ask AI about comparison`,
            description:
              () => `Hello! I can help you with questions about comparison shown.
                What would you like to know?`,
          }}
        >
          <div className="flex flex-col h-full w-full">
            <SidepanelChatbot />
          </div>
        </PropProvider>
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

type AssistantModalButtonProps = { "data-state"?: "open" | "closed" };

const AssistantModalButton = forwardRef<
  HTMLButtonElement,
  AssistantModalButtonProps
>(({ "data-state": state, ...rest }, ref) => {
  const tooltip = state === "open" ? "Close Assistant" : "Open Assistant";

  return (
    <TooltipIconButton
      variant="default"
      tooltip={tooltip}
      side="left"
      {...rest}
      className="aui-modal-button size-full rounded-full shadow transition-transform hover:scale-110 active:scale-90"
      ref={ref}
    >
      <BotIcon
        data-state={state}
        className="aui-modal-button-closed-icon absolute size-6 transition-all data-[state=closed]:rotate-0 data-[state=open]:rotate-90 data-[state=closed]:scale-100 data-[state=open]:scale-0"
      />

      <ChevronDownIcon
        data-state={state}
        className="aui-modal-button-open-icon absolute size-6 transition-all data-[state=closed]:-rotate-90 data-[state=open]:rotate-0 data-[state=closed]:scale-0 data-[state=open]:scale-100"
      />
      <span className="aui-sr-only sr-only">{tooltip}</span>
    </TooltipIconButton>
  );
});
