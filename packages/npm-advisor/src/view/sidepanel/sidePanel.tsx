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
  InsightsTab,
  AssistantMessage,
  UserMessage,
  GlobalHeader,
  ErrorBoundary,
} from "./components";
import { usePackageStats } from "./hooks/usePackageStats";
import { getSystemPrompt } from "./components/askAI/getSystemPrompt";
import { ThemeProvider } from "./context/themeContext";
import { downloadMarkdownFile } from "../../utils";

const SidePanel = () => {
  const {
    stats,
    loading,
    error,
    isAddedToCompare,
    handleAddToCompare,
    handleAddRecommendationToCompare,
    comparisonBucketNames,
    addingRecommendations,
  } = usePackageStats();

  if (loading) return <LoadingState />;
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
            className="flex flex-col h-full w-full"
          >
            <GlobalHeader />
            <SidepanelChatbot />
          </SidebarProvider>
        </PropProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default SidePanel;
