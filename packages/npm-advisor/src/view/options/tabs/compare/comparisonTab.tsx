/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import PackageSearch from "./search";
import { ComparisonTable } from "./table/comparisonTable";
import { EmptyState } from "./table/emptyState";
import { WinnerBanner } from "./table/winnerBanner";

interface ComparisonTabProps {
  comparisonBucket: any[];
  handleClearComparison: () => void;
  handleRemovePackage: (packageName: string) => void;
  winnerName: string | null;
}

/**
 * Comparison Tab.
 */
export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  comparisonBucket,
  handleClearComparison,
  handleRemovePackage,
  winnerName,
}) => (
  <div className="mt-8">
    <PackageSearch />
    {comparisonBucket.length === 0 ? (
      <EmptyState />
    ) : (
      <ComparisonTable
        comparisonBucket={comparisonBucket}
        handleClearComparison={handleClearComparison}
        handleRemovePackage={handleRemovePackage}
        winnerName={winnerName}
      />
    )}
    {comparisonBucket.length > 0 && winnerName && (
      <WinnerBanner winnerName={winnerName} />
    )}
  </div>
);
