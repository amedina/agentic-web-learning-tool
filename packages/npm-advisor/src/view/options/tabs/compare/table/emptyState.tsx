/**
 * External dependencies.
 */
import { BarChart2 } from "lucide-react";

export const EmptyState = () => (
  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
    <BarChart2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
    <p className="text-slate-500 dark:text-slate-400 font-medium">
      Your comparison bucket is empty.
    </p>
    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
      Visit an NPM package and click &quot;+ Compare&quot; in the popup menu.
    </p>
  </div>
);
