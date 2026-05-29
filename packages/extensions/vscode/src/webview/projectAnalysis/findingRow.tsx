/**
 * External dependencies.
 */
import { useCallback, type FC } from "react";
import { ExternalLink } from "lucide-react";
import type { ProjectFinding } from "@agentic-web-labs/project-analyzer-core";

/**
 * Internal dependencies.
 */
import { SeverityIcon } from "./severityIcon";
import type { PostReveal } from "./types";

interface FindingRowProps {
  finding: ProjectFinding;
  postReveal: PostReveal;
}

/**
 * Renders a single publint finding: severity icon, message, rule code,
 * and optional "Open file" / "Docs" actions.
 */
export const FindingRow: FC<FindingRowProps> = ({ finding, postReveal }) => {
  const handleOpen = useCallback(() => {
    if (!finding.file) {
      return;
    }
    postReveal(finding.file, finding.range);
  }, [finding, postReveal]);

  const documentationUrl =
    typeof finding.data?.documentationUrl === "string"
      ? finding.data.documentationUrl
      : undefined;

  return (
    <li className="px-3 py-2 flex items-start gap-2 text-sm">
      <SeverityIcon severity={finding.severity} />
      <div className="flex-1 min-w-0">
        <div className="text-slate-700 dark:text-slate-200 wrap-break-word">
          {finding.message}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <code className="font-mono">{finding.code}</code>
          {finding.file && (
            <button
              type="button"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
              onClick={handleOpen}
            >
              Open file
            </button>
          )}
          {documentationUrl && (
            <a
              href={documentationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 hover:text-slate-700 dark:hover:text-slate-200 underline-offset-2 hover:underline"
            >
              Docs
              <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </li>
  );
};
