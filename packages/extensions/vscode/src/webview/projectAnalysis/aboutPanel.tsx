/**
 * External dependencies.
 */
import { type FC } from "react";
import { Repeat, ShieldCheck, X } from "lucide-react";

interface AboutPanelProps {
  onClose: () => void;
}

/**
 * Inline help panel describing both analyzers and why their findings
 * matter. Visible only when the user clicks the help icon next to the
 * run button — kept compact so it doesn't push results offscreen.
 */
export const AboutPanel: FC<AboutPanelProps> = ({ onClose }) => {
  return (
    <div className="rounded border border-sky-200 dark:border-sky-900 bg-sky-50/60 dark:bg-sky-950/40 p-3 text-xs text-slate-700 dark:text-slate-200">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-800 dark:text-slate-100">
          About this analysis
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Close"
        >
          <X size={12} />
        </button>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <div>
          <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
            <ShieldCheck size={12} />
            Publishing hygiene
            <span className="text-[10px] font-normal text-slate-500">
              (
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
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">
            Catches mistakes that would break consumers of your package after
            it&apos;s published: incorrect{" "}
            <code className="font-mono">exports</code>, missing types, ESM/CJS
            mismatches, files missing from{" "}
            <code className="font-mono">files</code>, deprecated fields, etc.
            <span className="italic">
              {" "}
              Helps you ship a package that works for everyone.
            </span>
          </div>
        </div>
        <div>
          <div className="font-semibold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
            <Repeat size={12} />
            Circular dependencies
            <span className="text-[10px] font-normal text-slate-500">
              (
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
          <div className="mt-0.5 text-slate-600 dark:text-slate-300">
            Detects import cycles in your source tree.
            <span className="italic">
              {" "}
              Cycles cause subtle runtime ordering bugs (undefined exports),
              break tree-shaking, and make refactors riskier. Each detected
              cycle includes a visual graph so you can spot the offending import
              edge at a glance.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
