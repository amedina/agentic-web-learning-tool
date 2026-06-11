/**
 * External dependencies.
 */
import { Fragment, type FC } from "react";
import {
  ExternalLink,
  FileJson,
  Recycle,
  Scale,
  ShieldAlert,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import { FindingSummaryBox } from "./findingSummaryBox";
import { isLikelyPackageName, npmPackageUrl } from "./helpers";
import { useProjectAnalysisActions } from "./projectAnalysisActionsContext";
import { VulnerabilityItem } from "./vulnerabilityItem";
import { LicenseItem } from "./licenseItem";
import { ProjectAnalysisTab } from "../projectAnalysisTab";
import type { PackageJsonFile } from "../protocol";
import type { PackageHealthEntry } from "../../projectHealth/types";

interface RowDetailsProps {
  /** Which sub-tab the row belongs to, selecting which detail boxes to show. */
  scope: "dependencies" | "project";
  entry: PackageHealthEntry;
  onOpenPackageJson: (uri: string) => void;
}

/**
 * Expanded body of a row, scoped to the active sub-tab. On the
 * Dependencies sub-tab it shows the vulnerabilities and license-issue
 * boxes (with mute / unmute). On the Project Analysis sub-tab it shows the
 * replaceable-dependencies box (with npm / doc links) and the full
 * per-package project analysis (publint + circular dependency graph)
 * reused from the standalone Project Analysis tab. Both end with an
 * "Open package.json" link.
 */
export const RowDetails: FC<RowDetailsProps> = ({
  scope,
  entry,
  onOpenPackageJson,
}) => {
  const actions = useProjectAnalysisActions();
  const packageJsonFile: PackageJsonFile = {
    uri: entry.uri,
    relativePath: entry.relativePath,
    name: entry.name,
  };

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2 dark:border-slate-800">
      {scope === "dependencies" ? (
        <div className="grid grid-cols-1 gap-2">
          <FindingSummaryBox
            icon={<ShieldAlert size={14} />}
            label="Vulnerabilities"
            count={entry.vulnerabilities.length}
            tone="danger"
            emptyText="No known vulnerabilities."
          >
            <ul className="flex flex-col gap-1.5">
              {entry.vulnerabilities.map((finding, index) => (
                <VulnerabilityItem
                  key={`${finding.id || finding.url}-${index}`}
                  finding={finding}
                />
              ))}
            </ul>
          </FindingSummaryBox>

          <FindingSummaryBox
            icon={<Scale size={14} />}
            label="License issues"
            count={entry.licenseIssues.length}
            tone="warning"
            emptyText="No license issues."
          >
            <ul className="flex flex-col gap-1.5">
              {entry.licenseIssues.map((finding, index) => (
                <LicenseItem
                  key={`${finding.packageName}-${index}`}
                  finding={finding}
                />
              ))}
            </ul>
          </FindingSummaryBox>

          <FindingSummaryBox
            icon={<Recycle size={14} />}
            label="Replaceable dependencies"
            count={entry.replaceable.length}
            tone="info"
            emptyText="No lighter alternatives suggested."
          >
            <ul className="flex flex-col gap-1.5">
              {entry.replaceable.map((suggestion, index) => (
                <li
                  key={`${suggestion.packageName}-${index}`}
                  className="rounded border border-sky-200 bg-white/60 p-2 text-xs dark:border-sky-900 dark:bg-slate-900/40"
                >
                  {suggestion.packageName ? (
                    <a
                      href={npmPackageUrl(suggestion.packageName)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-sky-700 hover:underline dark:text-sky-300"
                      title={`Open ${suggestion.packageName} on npmjs.com`}
                    >
                      {suggestion.packageName}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      dependency
                    </span>
                  )}
                  {suggestion.replacements.length > 0 ? (
                    <div className="mt-0.5 text-slate-600 dark:text-slate-300">
                      Use instead:{" "}
                      {suggestion.replacements.map(
                        (replacement, replacementIndex) => (
                          <Fragment key={replacement}>
                            {replacementIndex > 0 ? ", " : ""}
                            {isLikelyPackageName(replacement) ? (
                              <a
                                href={npmPackageUrl(replacement)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-700 hover:underline dark:text-sky-300"
                                title={`Open ${replacement} on npmjs.com`}
                              >
                                {replacement}
                              </a>
                            ) : suggestion.documentationUrl ? (
                              <a
                                href={suggestion.documentationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-700 hover:underline dark:text-sky-300"
                                title="Open the replacement documentation"
                              >
                                {replacement}
                              </a>
                            ) : (
                              <span>{replacement}</span>
                            )}
                          </Fragment>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="mt-0.5 text-slate-600 dark:text-slate-300">
                      {suggestion.message}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </FindingSummaryBox>
        </div>
      ) : (
        <section className="rounded border border-slate-200 dark:border-slate-800">
          <ProjectAnalysisTab
            activeFile={packageJsonFile}
            postRunRequest={actions.postRunRequest}
            postCacheRequest={actions.postCacheRequest}
            postReveal={actions.postReveal}
            postCopyPrompt={actions.postCopyPrompt}
            postSetupMcp={actions.postSetupMcp}
            hideFixWithAi
            hideReplacements
            hideHeader
          />
        </section>
      )}

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
