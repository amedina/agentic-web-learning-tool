/**
 * External dependencies.
 */
import { type FC } from "react";
import { Repeat, ShieldCheck } from "lucide-react";

/**
 * Empty-state explainer shown before the user kicks off the first run.
 * Lists the two analyzers the tab surfaces (publint + madge) so the
 * user knows what "Run analysis" actually inspects.
 */
export const IdleExplainer: FC = () => {
  return (
    <div className="flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-300">
      <p>
        Click <span className="font-medium">Run analysis</span> to inspect this
        project. Read-only — never modifies files.
      </p>
      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldCheck size={14} />
          Publishing hygiene
          <span className="text-xs font-normal text-slate-500">
            (powered by{" "}
            <a
              href="https://publint.dev"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              publint
            </a>
            )
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Catches mistakes that would break consumers of your package after
          it&apos;s published: incorrect{" "}
          <code className="font-mono">exports</code>, missing types, ESM/CJS
          mismatches, files missing from{" "}
          <code className="font-mono">files</code>, deprecated fields, etc.
        </div>
      </div>
      <div className="rounded border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/40 dark:bg-slate-900/30">
        <div className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Repeat size={14} />
          Circular dependencies
          <span className="text-xs font-normal text-slate-500">
            (powered by{" "}
            <a
              href="https://github.com/pahen/madge"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              madge
            </a>
            )
          </span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Detects import cycles in your source tree (
          <code className="font-mono">src/</code>,{" "}
          <code className="font-mono">lib/</code>, or project root). Cycles
          cause subtle runtime ordering bugs and break tree-shaking.
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Results land here and in the Problems panel. Subsequent runs are manual
        — analysis never fires on save.
      </p>
    </div>
  );
};
