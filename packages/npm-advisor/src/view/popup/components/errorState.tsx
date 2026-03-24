/**
 * External dependencies.
 */
import React from "react";
import { XCircle } from "lucide-react";

/**
 * Internal dependencies.
 */
import { GlobalHeader } from "./globalHeader";

interface ErrorStateProps {
  error: string | null;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => (
  <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 antialiased">
    <GlobalHeader />
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-800 text-center">
      <XCircle size={40} className="text-red-500 mb-4" />
      <p className="font-semibold text-red-700">{error || "No stats found"}</p>
      <p className="text-sm text-slate-500 mt-2">
        Open a package page on npmjs.com or a package.json on GitHub.
      </p>
    </div>
  </div>
);
