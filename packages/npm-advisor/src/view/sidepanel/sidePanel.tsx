/**
 * External dependencies
 */
import { PropProvider, SidepanelChatbot } from "@google-awlt/chatbot";
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
          extraTabs={[
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
        >
          <div className="flex flex-col h-full w-full">
            <GlobalHeader />
            <SidepanelChatbot />
          </div>
        </PropProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default SidePanel;
