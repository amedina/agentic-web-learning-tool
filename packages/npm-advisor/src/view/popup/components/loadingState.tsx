/**
 * External dependencies.
 */
import React from "react";
import { PackageSearch } from "lucide-react";

/**
 * Internal dependencies.
 */
import { GlobalHeader } from "./globalHeader";

export const LoadingState = () => (
  <div className="flex flex-col w-[500px] h-[600px] bg-slate-50 antialiased">
    <GlobalHeader />
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-800">
      <div className="animate-spin text-[#c94137] mb-4">
        <PackageSearch size={48} />
      </div>
      <p className="font-medium">Analyzing Package Data...</p>
    </div>
  </div>
);
