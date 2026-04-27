/**
 * External dependencies
 */
import { PropProvider, SidepanelChatbot } from "@google-awlt/chatbot";
import { SidebarProvider, Toaster } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import {
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
    pendingPackageName,
  } = usePackageStats();

  const hasAnalysableDependencies =
    !!packageJsonDependencies &&
    (packageJsonDependencies.dependencies.length > 0 ||
      packageJsonDependencies.devDependencies.length > 0 ||
      packageJsonDependencies.peerDependencies.length > 0);

  // Options / comparison / navigation / hard error messages stay as full
  // takeovers — they don't have meaningful tabs/skeletons to show.
  if (isNavigationMessage) {
    return (
      <>
        <Toaster position="bottom-center" />
        <NavigationMessage url={currentTabUrl} />
      </>
    );
  }

  if (isOptionsPage) {
    if (isComparisonPage) {
      return (
        <>
          <Toaster position="bottom-center" />
          <ComparisonPageSidePanel comparisonBucket={comparisonBucket} />
        </>
      );
    }
    return (
      <>
        <Toaster position="bottom-center" />
        <OptionsPageSidePanel />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Toaster position="bottom-center" />
        <ErrorState error={error} />
      </>
    );
  }

  // We're on a relevant npm/github page — render the full shell (tabs +
  // chatbot + suggestions + Ask AI) immediately. Per-widget skeletons fill
  // in until `stats` resolves so the panel never feels blocked.
  const isStatsLoading = loading || !stats;
  const headerPackageName = stats?.packageName ?? pendingPackageName ?? "";

  return (
    <ErrorBoundary>
      <Toaster position="bottom-center" />
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
                  pendingPackageName={pendingPackageName}
                  isLoading={isStatsLoading}
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
            // While stats are still loading, fall back to whatever package
            // name we know from the URL so the assistant has at least some
            // grounding context. Once stats resolve, the full payload is
            // serialized in.
            const statsPayload = stats
              ? JSON.stringify(stats, null, 2)
              : JSON.stringify({ packageName: headerPackageName }, null, 2);
            return getSystemPrompt(
              statsPayload,
              comparisonBucket.length > 0
                ? JSON.stringify(comparisonBucket, null, 2)
                : undefined,
            );
          }}
          suggestions={
            stats
              ? [
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
                ]
              : []
          }
          helperTextSet={{
            title: () =>
              headerPackageName
                ? `Ask AI about ${headerPackageName}`
                : "Ask AI",
            description: () =>
              headerPackageName
                ? `Hello! I can help you with questions about ${headerPackageName}. What would you like to know?`
                : "Hello! What would you like to know?",
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
