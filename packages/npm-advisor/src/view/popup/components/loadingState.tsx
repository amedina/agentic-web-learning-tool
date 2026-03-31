/**
 * External dependencies.
 */
import { PackageSearch } from "lucide-react";

export const LoadingState = () => (
  <div className="flex flex-col w-full h-full bg-slate-50 antialiased">
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-800">
      <div className="animate-spin text-[#c94137] mb-4">
        <PackageSearch size={48} />
      </div>
      <p className="font-medium">Analyzing Package Data...</p>
    </div>
  </div>
);
