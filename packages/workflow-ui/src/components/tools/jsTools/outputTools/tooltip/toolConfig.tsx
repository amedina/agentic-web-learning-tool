/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  TooltipConfigSchema,
  type TooltipConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => TooltipConfig | undefined;
  }>;
  config: TooltipConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [selector, setSelector] = useState<string>(config?.selector || "");

  useEffect(() => {
    setSelector(config?.selector || "");
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const selector = formData.get("selector") as string;

        const configResult = {
          title,
          selector,
        };

        const validation = TooltipConfigSchema.safeParse(configResult);
        if (!validation.success) {
          console.error("Invalid configuration:", validation.error);
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
          <MessageSquare
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
          Tooltip Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="selector"
            >
              CSS Selector
            </label>
            <input
              type="text"
              id="selector"
              name="selector"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm bg-white dark:bg-slate-900 dark:text-slate-100"
              placeholder=".target-element, #info-icon"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Selector of the element(s) to show the tooltip next to
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
