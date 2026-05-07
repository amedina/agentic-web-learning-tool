/**
 * External dependencies.
 */
import { useEffect, useState, type FC } from "react";
import { ChevronDown, FileJson, Info, Plug, RefreshCcw } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { PackageJsonFile } from "./protocol";

interface PackageJsonSwitcherProps {
  activeFile: PackageJsonFile | null;
  availableFiles: PackageJsonFile[];
  onSelect: (file: PackageJsonFile) => void;
  onRefresh: () => void;
  onSetupMcp: () => void;
}

/**
 * Header / switcher component shown at the top of the webview. When
 * a package.json is active, renders a collapsible row showing its
 * name + relative path with a chevron that reveals every other
 * package.json in the workspace. When none is active (empty state),
 * renders the same list expanded with a "please open a package.json"
 * caption above it.
 */
export const PackageJsonSwitcher: FC<PackageJsonSwitcherProps> = ({
  activeFile,
  availableFiles,
  onSelect,
  onRefresh,
  onSetupMcp,
}) => {
  const [expanded, setExpanded] = useState(!activeFile);
  const [legendOpen, setLegendOpen] = useState(false);

  // Collapse the file list whenever the active file changes (initial
  // load and after the user picks a file from the switcher), and
  // expand it when there's no active file (empty state).
  useEffect(() => {
    setExpanded(!activeFile);
  }, [activeFile?.uri]);

  const others = availableFiles.filter((file) => file.uri !== activeFile?.uri);

  if (!activeFile) {
    return (
      <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-start gap-2 px-3 py-3">
          <FileJson
            size={16}
            className="shrink-0 mt-0.5 text-slate-500 dark:text-slate-400"
          />
          <div className="min-w-0 text-sm text-slate-700 dark:text-slate-200">
            Please open a <code>package.json</code> file to view stats.
          </div>
        </div>
        {availableFiles.length > 0 ? (
          <FileList
            files={availableFiles}
            onSelect={onSelect}
            caption="Workspace package.json files"
          />
        ) : (
          <div className="px-3 pb-3 text-xs text-slate-500 dark:text-slate-400 italic">
            No package.json files were found in this workspace.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
      <div className="flex items-center gap-1 pr-1">
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          className="group flex-1 flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors outline-none"
        >
          <div className="flex items-start gap-2 min-w-0">
            <FileJson
              size={16}
              className="shrink-0 mt-0.5 text-slate-500 dark:text-slate-400"
            />
            <div className="min-w-0">
              <div
                className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate"
                title={activeFile.name ?? activeFile.relativePath}
              >
                {activeFile.name ?? activeFile.relativePath}
              </div>
              <div
                className="text-xs text-slate-500 dark:text-slate-400 truncate"
                title={activeFile.relativePath}
              >
                {activeFile.relativePath}
              </div>
            </div>
          </div>
          {others.length > 0 ? (
            <ChevronDown
              size={14}
              className={`shrink-0 text-slate-400 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setLegendOpen((previous) => !previous)}
          title="What do the package.json underline colors mean?"
          aria-label="Show diagnostic color legend"
          aria-pressed={legendOpen}
          className={`shrink-0 p-1.5 rounded transition-colors ${
            legendOpen
              ? "bg-slate-200/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
          }`}
        >
          <Info size={14} />
        </button>
        <button
          type="button"
          onClick={onSetupMcp}
          title="Set up the MCP server for Claude Code, Cursor, Claude Desktop"
          aria-label="Set up MCP server for AI clients"
          className="shrink-0 p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
        >
          <Plug size={14} />
        </button>
        <button
          type="button"
          onClick={onRefresh}
          title="Refresh package stats (clears cache)"
          aria-label="Refresh package stats"
          className="shrink-0 p-1.5 rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
        >
          <RefreshCcw size={14} />
        </button>
      </div>
      {legendOpen ? <DiagnosticLegend /> : null}
      {expanded && others.length > 0 ? (
        <FileList files={others} onSelect={onSelect} caption="Switch to" />
      ) : null}
    </div>
  );
};

/**
 * Inline legend documenting what the squiggle colors under
 * dependency entries in package.json mean. Lets users decode the
 * Problems-panel diagnostics without reading the README, and keeps
 * the contract in one place that any future rule additions update.
 */
const DiagnosticLegend: FC = () => (
  <div className="border-t border-slate-200/70 dark:border-slate-700/70 px-3 py-3 text-xs space-y-2 text-slate-700 dark:text-slate-300">
    <div className="font-medium text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
      Underline colors in package.json
    </div>
    <ul className="space-y-1.5">
      <LegendRow
        swatchClass="bg-red-500"
        label="Red"
        description="Security advisory at or above the configured severity floor"
      />
      <LegendRow
        swatchClass="bg-amber-400"
        label="Yellow"
        description="License incompatible with the target license, or package appears unmaintained"
      />
      <LegendRow
        swatchClass="bg-sky-400"
        label="Blue"
        description="Installed major version is several releases behind the latest"
      />
    </ul>
    <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
      Hover any squiggle in the editor to see the full diagnostic message.
      Configure thresholds under{" "}
      <code className="text-[11px]">npmAdvisor.*</code> in Settings.
    </div>
  </div>
);

interface LegendRowProps {
  swatchClass: string;
  label: string;
  description: string;
}

/** One row of the diagnostic legend: colored swatch + label + description. */
const LegendRow: FC<LegendRowProps> = ({ swatchClass, label, description }) => (
  <li className="flex items-start gap-2">
    <span
      className={`shrink-0 mt-1 inline-block w-2.5 h-2.5 rounded-full ${swatchClass}`}
      aria-hidden
    />
    <div className="min-w-0">
      <span className="font-medium text-slate-800 dark:text-slate-200">
        {label}
      </span>
      <span className="text-slate-600 dark:text-slate-400">
        {" "}
        — {description}
      </span>
    </div>
  </li>
);

interface FileListProps {
  files: PackageJsonFile[];
  caption: string;
  onSelect: (file: PackageJsonFile) => void;
}

/** Static list of package.json files rendered as clickable rows. */
const FileList: FC<FileListProps> = ({ files, caption, onSelect }) => (
  <div className="border-t border-slate-200/70 dark:border-slate-700/70 px-2 pt-2 pb-3">
    <div className="px-1 pb-1 text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {caption}
    </div>
    <ul className="space-y-0.5">
      {files.map((file) => (
        <li key={file.uri}>
          <button
            type="button"
            onClick={() => onSelect(file)}
            className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
          >
            <div className="text-sm text-slate-800 dark:text-slate-200 truncate">
              {file.name ?? file.relativePath}
            </div>
            {file.name ? (
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {file.relativePath}
              </div>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  </div>
);
