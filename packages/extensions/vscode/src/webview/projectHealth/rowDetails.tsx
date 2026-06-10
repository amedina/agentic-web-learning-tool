/**
 * External dependencies.
 */
import { type FC } from "react";
import { FileJson, ShieldCheck } from "lucide-react";

/**
 * Internal dependencies.
 */
import { useProjectAnalysisActions } from "./projectAnalysisActionsContext";
import { VulnerabilityItem } from "./vulnerabilityItem";
import { LicenseItem } from "./licenseItem";
import { ProjectAnalysisTab } from "../projectAnalysisTab";
import type { PackageJsonFile } from "../protocol";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface RowDetailsProps {
  entry: PackageHealthEntry;
  onOpenPackageJson: (uri: string) => void;
}

/**
 * Expanded body of a row: the vulnerability and license lists from the
 * fast pass, the full per-package project analysis (publint, circular
 * dependencies graph, replacement suggestions, and the "fix with AI"
 * copy-prompt) reusing the standalone ProjectAnalysisTab, and an
 * "Open package.json" link.
 */
export const RowDetails: FC<RowDetailsProps> = ({
  entry,
  onOpenPackageJson,
}) => {
  const actions = useProjectAnalysisActions();
  const hasVulnerabilities = entry.vulnerabilities.length > 0;
  const hasLicenseIssues = entry.licenseIssues.length > 0;
  const hasDependencyIssues = hasVulnerabilities || hasLicenseIssues;
  const packageJsonFile: PackageJsonFile = {
    uri: entry.uri,
    relativePath: entry.relativePath,
    name: entry.name,
  };

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
      {!hasDependencyIssues ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
          <ShieldCheck size={13} />
          No vulnerabilities or license issues.
        </div>
      ) : null}
      <section className="rounded border border-slate-200 dark:border-slate-800">
        <ProjectAnalysisTab
          activeFile={packageJsonFile}
          postRunRequest={actions.postRunRequest}
          postCacheRequest={actions.postCacheRequest}
          postReveal={actions.postReveal}
          postCopyPrompt={actions.postCopyPrompt}
          postSetupMcp={actions.postSetupMcp}
        />
      </section>
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
