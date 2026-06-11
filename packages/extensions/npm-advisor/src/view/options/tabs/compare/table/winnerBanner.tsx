/**
 * External dependencies.
 */
import { Award } from "lucide-react";

interface WinnerBannerProps {
  winnerName: string;
}

export const WinnerBanner: React.FC<WinnerBannerProps> = ({ winnerName }) => (
  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
    <h4 className="flex items-center text-green-800 dark:text-green-300 font-semibold mb-1">
      <Award className="w-5 h-5 mr-2" />
      Winner: {winnerName}
    </h4>
    <p className="text-sm text-green-700 dark:text-green-400">
      Based on bundle sizes, dependency counts, and modern native alternatives
      metrics, <span className="font-bold">{winnerName}</span> emerged as the
      most efficient choice in this comparison bucket.
    </p>
  </div>
);
