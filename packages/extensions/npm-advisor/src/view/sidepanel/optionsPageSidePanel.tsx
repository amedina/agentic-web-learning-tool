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
import { ThemeProvider } from "./context/themeContext";
import { downloadMarkdownFile } from "../../utils";

const OptionsPageSidePanel = () => {
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
          assistantMessage={AssistantMessage}
          userMessage={UserMessage}
          getCustomSystemPrompt={() => ""}
          suggestions={[]}
          helperTextSet={{
            title: () => "Ask AI",
            description: () =>
              "Hello! I can help you with questions about packages. What would you like to know?",
          }}
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
