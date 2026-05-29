/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import type { PackageJsonFile } from "./protocol";

interface FileListProps {
  files: PackageJsonFile[];
  caption: string;
  onSelect: (file: PackageJsonFile) => void;
}

/** Static list of package.json files rendered as clickable rows. */
export const FileList: FC<FileListProps> = ({ files, caption, onSelect }) => (
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
