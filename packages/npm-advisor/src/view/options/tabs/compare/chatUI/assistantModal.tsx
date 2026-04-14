/**
 * External dependencies
 */
import { BotIcon, ChevronDownIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tooltip,
} from "@google-awlt/design-system";
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="animate-bounce aui-modal-button rounded-full shadow fixed right-4 bottom-4 size-11 text-background bg-foreground flex justify-center items-center">
        <AssistantModalButton data-state={open ? "open" : "closed"} />
      </SheetTrigger>
      <SheetContent
        data-sidebar="sidebar"
        data-slot="sidebar"
        data-mobile="true"
        className="bg-background text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
        // @ts-ignore - ts(2322)
        style={
          {
            "--sidebar-width": "35rem",
          } as React.CSSProperties
        }
        side="right"
      >
        <SheetClose>
          <X className="h-4 w-4" />
        </SheetClose>
        <SheetHeader className="sr-only">
          <SheetTitle>NPM Package Comparison Advisor</SheetTitle>
          <SheetDescription>Ask AI about package comparison.</SheetDescription>
        </SheetHeader>
        <div className="flex h-full w-full flex-col">
          {" "}
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
            view="npm-advisor"
            suggestions={[
              {
                text: "Compare all packages",
                prompt: "Compare all of these packages.",
              },
              {
                text: "Which is the winner?",
                prompt:
                  "Out of these packages, which one is the winner and why?",
              },
              {
                text: "Any native alternatives?",
                prompt: "Are there modern native alternatives?",
              },
              {
                text: "Find similar packages",
                prompt: "Find more similar packages to these.",
              },
            ]}
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

type AssistantModalButtonProps = { "data-state"?: "open" | "closed" };

const AssistantModalButton = ({
  "data-state": state,
  ...rest
}: AssistantModalButtonProps) => {
  const tooltip = state === "open" ? "Close Assistant" : "Open Assistant";

  return (
    <Tooltip {...rest}>
      <>
        <BotIcon
          data-state={state}
          className="aui-modal-button-closed-icon absolute size-6 transition-all data-[state=closed]:rotate-0 data-[state=open]:rotate-90 data-[state=closed]:scale-100 data-[state=open]:scale-0"
        />

        <ChevronDownIcon
          data-state={state}
          className="aui-modal-button-open-icon absolute size-6 transition-all data-[state=closed]:-rotate-90 data-[state=open]:rotate-0 data-[state=closed]:scale-0 data-[state=open]:scale-100"
        />
        <span className="aui-sr-only sr-only">{tooltip}</span>
      </>
    </Tooltip>
  );
};
