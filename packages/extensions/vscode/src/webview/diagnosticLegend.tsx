/**
 * External dependencies.
 */
import { type FC } from "react";

/**
 * Internal dependencies.
 */
import { LegendRow } from "./legendRow";

/**
 * Inline legend documenting what the squiggle colors under
 * dependency entries in package.json mean. Lets users decode the
 * Problems-panel diagnostics without reading the README, and keeps
 * the contract in one place that any future rule additions update.
 */
export const DiagnosticLegend: FC = () => (
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
