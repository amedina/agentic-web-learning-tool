/**
 * External dependencies.
 */
import React from "react";

/**
 * Internal dependencies.
 */
import PackageSearch from "./search";
import { EmptyState } from "./table/emptyState";
import { WinnerBanner } from "./table/winnerBanner";
import { SidepanelComparisonTable } from "../../../shared/sidepanelComparisonTable";

interface ComparisonTabProps {
  comparisonBucket: any[];
  winnerName: string | null;
}

/**
 * Comparison Tab.
 */
export const ComparisonTab: React.FC<ComparisonTabProps> = ({
  comparisonBucket,
  winnerName,
}) => (
  <div className="mt-[-10px]">
    <PackageSearch />
    {comparisonBucket.length === 0 ? (
      <EmptyState />
    ) : (
      <SidepanelComparisonTable showHeader={false} />
    )}
    {comparisonBucket.length > 0 && winnerName && (
      <WinnerBanner winnerName={winnerName} />
    )}
  </div>
);
