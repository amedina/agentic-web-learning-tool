/**
 * External dependencies.
 */
import { type FC } from "react";
import { FileJson, ShieldCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import { VulnerabilityItem } from "./vulnerabilityItem";
import { LicenseItem } from "./licenseItem";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface RowDetailsProps {
  entry: PackageHealthEntry;
  onOpenPackageJson: (uri: string) => void;
}

/**
 * Expanded body of a row: the list of vulnerabilities, the list of
 * license issues, and the "Open package.json" link. Renders a friendly
 * empty line when a package has no surfaced issues.
 */
export const RowDetails: FC<RowDetailsProps> = ({
  entry,
  onOpenPackageJson,
}) => {
  const hasVulnerabilities = entry.vulnerabilities.length > 0;
  const hasLicenseIssues = entry.licenseIssues.length > 0;
  const hasIssues = hasVulnerabilities || hasLicenseIssues;

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
      {hasVulnerabilities ? (
        <section className="flex flex-col gap-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Vulnerabilities
          </h4>
          <ul className="flex flex-col gap-1.5">
            {entry.vulnerabilities.map((finding, index) => (
              <VulnerabilityItem
                key={`${finding.id || finding.url}-${index}`}
                finding={finding}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {hasLicenseIssues ? (
        <section className="flex flex-col gap-1.5">
          <h4 className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            License issues
          </h4>
          <ul className="flex flex-col gap-1.5">
            {entry.licenseIssues.map((finding, index) => (
              <LicenseItem
                key={`${finding.packageName}-${index}`}
                finding={finding}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {!hasIssues ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={13} />
          No vulnerabilities or license issues.
        </div>
      ) : null}
      <button
        type="button"
        className="inline-flex items-center gap-1 self-start text-[11px] text-slate-500 hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200"
        onClick={() => onOpenPackageJson(entry.uri)}
      >
        <FileJson size={12} />
        Open package.json
      </button>
    </div>
  );
};
