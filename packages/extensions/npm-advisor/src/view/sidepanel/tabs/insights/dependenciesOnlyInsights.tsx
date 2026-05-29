/**
 * External dependencies.
 */
import React from "react";
import { Boxes } from "lucide-react";

interface DependenciesOnlyInsightsProps {
  unpublishedPackageName: string | null;
  onOpenDependencies: () => void;
}

/**
 * Empty-state card shown in the Insights tab when the active `package.json`
 * has no published package to score but does declare dependencies. Adapts its
 * copy to whether the file names an unpublished package or is a nameless
 * workspace / monorepo root, then points the user at the Dependencies tab.
 */
export const DependenciesOnlyInsights: React.FC<
  DependenciesOnlyInsightsProps
> = ({ unpublishedPackageName, onOpenDependencies }) => (
  <div className="flex flex-col w-full h-full bg-background antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="flex items-center justify-center size-14 rounded-full bg-fiery-orange/10 text-fiery-orange mb-4">
        <Boxes size={28} />
      </div>
      <h2 className="text-base font-semibold text-foreground mb-2">
        {unpublishedPackageName
          ? "Package not published on npm"
          : "Workspace / monorepo root"}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        {unpublishedPackageName ? (
          <>
            <code className="text-xs px-1 py-0.5 rounded bg-muted">
              {unpublishedPackageName}
            </code>{" "}
            isn&apos;t published on npmjs.com, so there&apos;s no package to
            score. Its declared dependencies can still be analyzed individually.
          </>
        ) : (
          <>
            This{" "}
            <code className="text-xs px-1 py-0.5 rounded bg-muted">
              package.json
            </code>{" "}
            doesn&apos;t declare a{" "}
            <code className="text-xs px-1 py-0.5 rounded bg-muted">name</code>,
            so there&apos;s no published package to score. Its declared
            dependencies can still be analyzed individually.
          </>
        )}
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
