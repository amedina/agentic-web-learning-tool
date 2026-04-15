/**
 * External dependencies
 */
import { PropProvider, SidepanelChatbot } from "@google-awlt/chatbot";
import { SidebarProvider } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import {
  AssistantMessage,
  UserMessage,
  GlobalHeader,
  ErrorBoundary,
} from "./tabs";
import { getSystemPrompt as getCompareSystemPrompt } from "./tabs/compare/getSystemPrompt";
import { AssistantMessage as CompareAssistantMessage } from "./tabs/compare/assistantMessage";
import { ThemeProvider } from "./context/themeContext";
import { downloadMarkdownFile } from "../../utils";

interface OptionsPageSidePanelProps {
  isComparisonPage: boolean;
  comparisonBucket: unknown;
}

const OptionsPageSidePanel = ({
  isComparisonPage,
  comparisonBucket,
}: OptionsPageSidePanelProps) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PropProvider
          allowToolCalling={false}
          isOptionsPage={true}
          exportChatCallback={downloadMarkdownFile}
          customIcon={
            <img
              src="/icons/icon.png"
              alt="NPM Advisor Logo"
              className="w-[42px] h-[42px] rounded shrink-0 object-contain shadow-sm bg-white p-1"
            />
          }
          footerNode={<></>}
          subHeaderNode={<GlobalHeader />}
          assistantMessage={
            isComparisonPage ? CompareAssistantMessage : AssistantMessage
          }
          userMessage={UserMessage}
          getCustomSystemPrompt={
            isComparisonPage
              ? () =>
                  getCompareSystemPrompt(
                    JSON.stringify(comparisonBucket, null, 2),
                  )
              : undefined
          }
          suggestions={
            isComparisonPage
              ? [
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
                ]
              : undefined
          }
          helperTextSet={
            isComparisonPage
              ? {
                  title: () => "Ask AI about comparison",
                  description: () =>
                    "Hello! I can help you with questions about comparison shown. What would you like to know?",
                }
              : {
                  title: () => "Ask AI",
                  description: () =>
                    "Hello! I can help you with questions about packages. What would you like to know?",
                }
          }
        >
          <SidebarProvider
            defaultOpen={false}
            className="flex flex-col h-full w-full overflow-hidden"
          >
            <div className="flex-1 min-h-0 overflow-hidden">
              <SidepanelChatbot />
            </div>
          </SidebarProvider>
        </PropProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default OptionsPageSidePanel;
