/**
 * External dependencies
 */
import { useImperativeHandle, useState } from "react";
import { Settings } from "lucide-react";
import { LoopConfigSchema, type LoopConfig } from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import logger from "../../../../../logger";
interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => LoopConfig | undefined;
  }>;
  config: LoopConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [maxIterations, setMaxIterations] = useState<number>(
    config.maxIterations || 1,
  );

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const maxIterations = +formData.get("maxIterations")!;

        const configResult = {
          title,
          maxIterations,
        };

        const validation = LoopConfigSchema.safeParse(configResult);
        if (!validation.success) {
          logger(["error"], ["Invalid configuration:", validation.error]);
          return undefined;
        }

        return validation.data;
      },
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Settings
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
          Loop Configuration
        </h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            This node redirects all connections from the &quot;ITEM&quot; handle
            for each element in the input list. The &quot;DONE&quot; handle
            fires once the loop is completed.
          </p>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="maxIterations"
            >
              Max Iterations
            </label>
            <input
              type="number"
              name="maxIterations"
              id="maxIterations"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              min={1}
              max={1000}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
