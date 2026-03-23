import React from "react";
import { ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import type { LicenseCompatibilityResult } from "../../../utils";

interface LicenseCheckProps {
  licenseCompatibility: LicenseCompatibilityResult | null;
}

export const LicenseCheck: React.FC<LicenseCheckProps> = ({
  licenseCompatibility,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h2 className="text-sm font-semibold flex items-center text-slate-800 mb-2">
        <ShieldAlert size={16} className="mr-2 text-slate-600" /> License Check
      </h2>
      {licenseCompatibility ? (
        <div
          className={`p-2 rounded-lg flex items-start space-x-2 ${licenseCompatibility.isCompatible ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}
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
        <p className="text-sm text-slate-500">Unknown compatibility status</p>
      )}
    </div>
  );
};
