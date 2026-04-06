/**
 * External dependencies
 */
import { BotIcon, ChevronDownIcon } from "lucide-react";
import { forwardRef, useEffect, useState } from "react";
import { AssistantModalPrimitive } from "@assistant-ui/react";
import { TooltipIconButton } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import { ChatUI } from "./chatUI";

interface AssistantModalProps {
  apiKeys: { gemini?: string; openai?: string };
  changeTabToSettings: () => void;
}

export const AssistantModal = ({
  apiKeys,
  changeTabToSettings,
}: AssistantModalProps) => {
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
        <ChatUI apiKeys={apiKeys} changeTabToSettings={changeTabToSettings} />
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
