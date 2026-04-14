/**
 * External dependencies.
 */
import React from "react";
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { LicenseCompatibilityResult } from "../../../../utils";

export interface LicenseCheckProps {
  licenseCompatibility: LicenseCompatibilityResult | null;
}

export const LicenseCheck: React.FC<LicenseCheckProps> = ({
  licenseCompatibility,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 dark:text-slate-200 mb-2">
        <ShieldAlert
          size={16}
          className="mr-2 text-slate-600 dark:text-slate-400"
        />{" "}
        License Check
      </h2>
      {licenseCompatibility ? (
        <div
          className={`p-2 rounded-lg flex items-start space-x-2 ${licenseCompatibility.isCompatible ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300" : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"}`}
        >
          {licenseCompatibility.isCompatible ? (
            <CheckCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0" />
          )}
          <div className="text-sm">
            <p className="font-medium leading-tight">
              {licenseCompatibility.isCompatible
                ? "Compatible with MIT"
                : "Incompatible License"}
            </p>
            {licenseCompatibility.explanation &&
            licenseCompatibility.explanation !== "n.a." ? (
              <p className="text-xs mt-1 opacity-80 leading-snug">
                {licenseCompatibility.explanation}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Unknown license — compatibility cannot be determined
        </p>
      )}
    </div>
  );
};
