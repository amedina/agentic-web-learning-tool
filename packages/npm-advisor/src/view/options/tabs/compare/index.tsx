/**
 * External dependencies
 */
import { useEffect, useState, useMemo } from "react";
import { OptionsPageTab } from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import { ComparisonTab } from "./comparisonTab";
import { calculateScore } from "../../../../utils/calculateScore";
import { AssistantModal } from "./assistantModal";

export default function ComparisonPage() {
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      if (res.comparisonBucket) {
        setComparisonBucket(res.comparisonBucket as any[]);
      }
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.comparisonBucket) {
        setComparisonBucket((changes.comparisonBucket.newValue as any[]) || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleClearComparison = () => {
    chrome.storage.local.set({ comparisonBucket: [] }, () =>
      setComparisonBucket([]),
    );
  };

  const handleRemovePackage = (packageName: string) => {
    const updated = comparisonBucket.filter(
      (p) => p.packageName !== packageName,
    );
    chrome.storage.local.set({ comparisonBucket: updated }, () =>
      setComparisonBucket(updated),
    );
  };

  const winnerName = useMemo(() => {
    if (comparisonBucket.length === 0) return null;
    let bestScore = -Infinity;
    let winner = null;
    comparisonBucket.forEach((pkg) => {
      const score = calculateScore(pkg);
      if (score > bestScore) {
        bestScore = score;
        winner = pkg.packageName;
      }
    });
    return winner;
  }, [comparisonBucket]);

  return (
    <OptionsPageTab
      title="Compare"
      description="Compare NPM packages side by side based on key metrics."
    >
      <ComparisonTab
        comparisonBucket={comparisonBucket}
        handleClearComparison={handleClearComparison}
        handleRemovePackage={handleRemovePackage}
        winnerName={winnerName}
      />
      <AssistantModal comparisonBucket={comparisonBucket} />
    </OptionsPageTab>
  );
}
