/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { Pencil } from "lucide-react";
import {
  DomReplacementConfigSchema,
  type DomReplacementConfig,
} from "@google-awlt/engine-core";
/**
 * Internal dependencies
 */
import logger from "../../../../../logger";
interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => DomReplacementConfig | undefined;
  }>;
  config: DomReplacementConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [selector, setSelector] = useState<string>(config?.selector || "");
  const [isMultiple, setIsMultiple] = useState<boolean>(
    config?.isMultiple || false,
  );
  const [replaceSelection, setReplaceSelection] = useState<boolean>(
    config?.replaceSelection || false,
  );
  const [mode, setMode] = useState<string>(config?.mode || "textContent");

  useEffect(() => {
    setSelector(config?.selector || "");
    setIsMultiple(config?.isMultiple || false);
    setReplaceSelection(config?.replaceSelection || false);
    setMode(config?.mode || "textContent");
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const replaceSelection = formData.get("replaceSelection") !== null;
        const selector = formData.get("selector") as string;
        const isMultiple = formData.get("isMultiple") !== null;
        const mode = formData.get("mode") as string;

        const configResult = {
          title,
          replaceSelection,
          selector: replaceSelection ? undefined : selector,
          isMultiple: replaceSelection ? false : isMultiple,
          mode: replaceSelection ? undefined : mode,
        };

        const validation = DomReplacementConfigSchema.safeParse(configResult);
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
          <Pencil size={16} className="text-indigo-600 dark:text-indigo-400" />
          DOM Replacement Configuration
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="replaceSelection"
              name="replaceSelection"
              checked={replaceSelection}
              onChange={(e) => setReplaceSelection(e.target.checked)}
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
            />
            <label
              htmlFor="replaceSelection"
              className="text-sm font-semibold text-slate-800 dark:text-slate-100 select-none cursor-pointer"
            >
              Replace current selection
            </label>
          </div>

          {!replaceSelection && (
            <>
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
                  placeholder=".post-content, #main-title"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Selector of the element to replace content for
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  htmlFor="mode"
                >
                  Replacement Mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm bg-white dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="textContent">Text Content</option>
                  <option value="innerHTML">Inner HTML</option>
                  <option value="innerText">Inner Text</option>
                  <option value="value">Input Value</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  What property of the element to replace
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isMultiple"
                  name="isMultiple"
                  checked={isMultiple}
                  onChange={(e) => setIsMultiple(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 dark:text-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800"
                />
                <label
                  htmlFor="isMultiple"
                  className="text-sm text-slate-700 dark:text-slate-300 select-none cursor-pointer"
                >
                  Replace all matching elements
                </label>
              </div>
            </>
          )}

          {replaceSelection && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-100 dark:border-indigo-800">
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                <strong>Note:</strong> This tool will replace the text you
                captured using the <em>Selection Tool</em> earlier in the
                workflow. It preserves the exact location even if you click
                away.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
