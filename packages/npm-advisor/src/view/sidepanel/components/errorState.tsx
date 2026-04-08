/**
 * External dependencies.
 */
import { XCircle } from "lucide-react";

interface ErrorStateProps {
  error: string | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => (
  <div className="flex flex-col w-full h-full bg-slate-50 dark:bg-slate-900 antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-200 text-center">
      <XCircle size={40} className="text-red-500 mb-4" />
      <p className="font-semibold text-red-700 dark:text-red-400">
        {error || "No stats found"}
      </p>
    </div>
  </div>
);
