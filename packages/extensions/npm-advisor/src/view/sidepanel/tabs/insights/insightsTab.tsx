/**
 * External dependencies.
 */
import React from "react";
import { Boxes } from "lucide-react";
import { usePropProvider } from "@agentic-web-labs/chatbot";
import { InsightsTab } from "@agentic-web-labs/package-analyzer-ui";
import { type PackageStats } from "@agentic-web-labs/package-analyzer-core";

interface InsightsTabProps {
  stats: PackageStats | null;
  pendingPackageName: string | null;
  isLoading: boolean;
  isWorkspaceRoot?: boolean;
  onAddToCompare: () => void;
  isAddedToCompare: boolean;
  onAddRecommendationToCompare: (packageName: string) => void;
  comparisonBucketNames: Set<string>;
  addingRecommendations: Set<string>;
}

/**
 * Renders the Insights tab content for the npm-advisor side panel. Defers to
 * the shared `InsightsTab` for normal packages, and substitutes a friendly
 * "workspace root" card when the active page is a monorepo `package.json`
 * with no `name` field — there's no package to analyze, but the Dependencies
 * tab can still do useful work.
 */
export const ChromeInsightsTab: React.FC<InsightsTabProps> = (props) => {
  const { setActiveTab } = usePropProvider(({ actions }) => ({
    setActiveTab: actions.setActiveTab,
  }));

  if (props.isWorkspaceRoot) {
    return (
      <WorkspaceRootInsights
        onOpenDependencies={() => setActiveTab("dependencies")}
      />
    );
  }

  return (
    <InsightsTab
      {...props}
      onNavigateToComparison={() => setActiveTab("comparison")}
    />
  );
};

/**
 * Empty-state card shown in the Insights tab when the user opens a
 * workspace / monorepo root `package.json`. Explains why insights are
 * unavailable and points the user to the Dependencies tab.
 */
const WorkspaceRootInsights: React.FC<{ onOpenDependencies: () => void }> = ({
  onOpenDependencies,
}) => (
  <div className="flex flex-col w-full h-full bg-background antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center justify-center size-14 rounded-full bg-fiery-orange/10 text-fiery-orange mb-4">
        <Boxes size={28} />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-2">
        Workspace / monorepo root
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        This{" "}
        <code className="text-xs px-1 py-0.5 rounded bg-muted">
          package.json
        </code>{" "}
        doesn&apos;t declare a{" "}
        <code className="text-xs px-1 py-0.5 rounded bg-muted">name</code>, so
        there&apos;s no published package to score. Its declared dependencies
        can still be analyzed individually.
      </p>
      <button
        type="button"
        onClick={onOpenDependencies}
        className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-medium bg-fiery-orange text-white hover:bg-fiery-orange/90 transition-colors"
      >
        Open Dependencies
      </button>
    </div>
  </div>
);
