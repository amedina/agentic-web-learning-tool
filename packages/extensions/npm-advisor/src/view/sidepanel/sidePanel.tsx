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
  ReportTab,
  ComparisonTab,
  AssistantMessage,
  UserMessage,
  GlobalHeader,
  ErrorBoundary,
} from "./tabs";
import { usePackageStats } from "./hooks/usePackageStats";
import { getSystemPrompt } from "./tabs/askAI/getSystemPrompt";
import { ThemeProvider } from "./context/themeContext";
import { downloadMarkdownFile } from "../../utils";
import OptionsPageSidePanel from "./optionsPageSidePanel";
import ComparisonPageSidePanel from "./comparisonPageSidePanel";

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
    currentTabUrl,
    packageJsonDependencies,
  } = usePackageStats();

  const hasAnalysableDependencies =
    !!packageJsonDependencies &&
    (packageJsonDependencies.dependencies.length > 0 ||
      packageJsonDependencies.devDependencies.length > 0 ||
      packageJsonDependencies.peerDependencies.length > 0);

  if (loading) return <LoadingState />;
  if (isNavigationMessage) return <NavigationMessage url={currentTabUrl} />;

  if (isOptionsPage) {
    if (isComparisonPage) {
      return <ComparisonPageSidePanel comparisonBucket={comparisonBucket} />;
    }
    return <OptionsPageSidePanel />;
  }

  if (error || !stats) return <ErrorState error={error} />;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <PropProvider
          allowToolCalling={false}
          view="npm-advisor"
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
            ...(hasAnalysableDependencies && packageJsonDependencies
              ? [
                  {
                    value: "report",
                    label: "Report",
                    content: (
                      <ReportTab
                        packageJsonDependencies={packageJsonDependencies}
                        onAddRecommendationToCompare={
                          handleAddRecommendationToCompare
                        }
                        comparisonBucketNames={comparisonBucketNames}
                        addingRecommendations={addingRecommendations}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          suffixTabs={
            comparisonBucket.length > 0
              ? [
                  {
                    value: "comparison",
                    label: (
                      <span className="flex items-center gap-1.5">
                        Comparison
                        <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-[#c94137] text-white text-[10px] font-bold leading-none">
                          {comparisonBucket.length}
                        </span>
                      </span>
                    ),
                    content: <ComparisonTab />,
                  },
                ]
              : []
          }
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
            return getSystemPrompt(
              JSON.stringify(stats, null, 2),
              comparisonBucket.length > 0
                ? JSON.stringify(comparisonBucket, null, 2)
                : undefined,
            );
          }}
          suggestions={[
            ...(comparisonBucket.length > 0
              ? [
                  {
                    text: "Compare all packages",
                    prompt: "Compare all of these packages.",
                  },
                ]
              : []),
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
