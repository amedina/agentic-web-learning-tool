/**
 * External dependencies
 */
import { PropProvider, SidepanelChatbot } from "@google-awlt/chatbot";
import { SidebarProvider } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import {
  LoadingState,
  ErrorState,
  NavigationMessage,
  InsightsTab,
  AssistantMessage,
  UserMessage,
  GlobalHeader,
  ErrorBoundary,
} from "./tabs";
import { usePackageStats } from "./hooks/usePackageStats";
import { getSystemPrompt } from "./tabs/askAI/getSystemPrompt";
import { getSystemPrompt as getCompareSystemPrompt } from "../options/tabs/compare/chatUI/getSystemPrompt";
import { AssistantMessage as CompareAssistantMessage } from "../options/tabs/compare/chatUI/assistantMessage";
import { ThemeProvider } from "./context/themeContext";
import { downloadMarkdownFile } from "../../utils";

const SidePanel = () => {
  const {
    stats,
    loading,
    error,
    isNavigationMessage,
    isOptionsPage,
    isComparisonPage,
    comparisonBucket,
    isAddedToCompare,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
  } = usePackageStats();

  if (loading) return <LoadingState />;
  if (isNavigationMessage) return <NavigationMessage />;

  if (isOptionsPage) {
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
  }

  if (error || !stats) return <ErrorState error={error} />;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PropProvider
          allowToolCalling={false}
          exportChatCallback={downloadMarkdownFile}
          prefixTabs={[
            {
              value: "insights",
              label: "Insights",
              content: (
                <InsightsTab
                  stats={stats}
                  onAddToCompare={handleAddToCompare}
                  isAddedToCompare={isAddedToCompare}
                  onAddRecommendationToCompare={
                    handleAddRecommendationToCompare
                  }
                  comparisonBucketNames={comparisonBucketNames}
                  addingRecommendations={addingRecommendations}
                />
              ),
            },
          ]}
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
          getCustomSystemPrompt={() => {
            return getSystemPrompt(JSON.stringify(stats, null, 2));
          }}
          suggestions={[
            {
              text: "Suggest better alternatives",
              prompt: `Suggest better alternatives to ${stats.packageName}`,
            },
            {
              text: "Compare with [Popular Library]",
              prompt: `Compare ${stats.packageName} with a popular alternative library`,
            },
            {
              text: "Is there a native JS way?",
              prompt: `Is there a native vanilla JavaScript way to do what ${stats.packageName} does?`,
            },
            {
              text: `Why use this over [X]?`,
              prompt: `Why should I use ${stats.packageName} over other options?`,
            },
          ]}
          helperTextSet={{
            title: () => `Ask AI about ${stats.packageName}`,
            description:
              () => `Hello! I can help you with questions about ${stats.packageName}. What
                would you like to know?`,
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

export default SidePanel;
