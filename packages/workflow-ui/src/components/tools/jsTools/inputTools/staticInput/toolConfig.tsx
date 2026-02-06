/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { Settings } from "lucide-react";
import {
  StaticInputConfigSchema,
  type StaticInputConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import logger from "../../../../../logger";
interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => StaticInputConfig | undefined;
  }>;
  config: StaticInputConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [inputValue, setInputValue] = useState<string>(config.inputValue || "");
  const [isMultiple, setIsMultiple] = useState<boolean>(
    config.isMultiple || false,
  );

  useEffect(() => {
    setInputValue(config.inputValue || "");
    setIsMultiple(config.isMultiple || false);
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const inputValue = formData.get("inputValue") as string;
        const isMultiple = formData.get("isMultiple") === "on";

        const configResult = {
          title,
          inputValue,
          isMultiple,
        };

        if (isMultiple) {
          try {
            JSON.parse(inputValue);
          } catch (error) {
            logger(["error"], ["Invalid JSON array:", error]);
            return undefined;
          }
        }

        const validation = StaticInputConfigSchema.safeParse(configResult);
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
          Static Input Configuration
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
            <input
              type="checkbox"
              id="isMultiple"
              name="isMultiple"
              checked={isMultiple}
              onChange={(e) => setIsMultiple(e.target.checked)}
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 border-slate-300 dark:border-slate-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-slate-800"
            />
            <div>
              <label
                htmlFor="isMultiple"
                className="text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Multiple Items (JSON Array)
              </label>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Treat the input as a JSON array of items
              </p>
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="inputValue"
            >
              {isMultiple ? "JSON Array Value" : "Input Value"}
            </label>
            <textarea
              id="inputValue"
              name="inputValue"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              rows={4}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm bg-white dark:bg-slate-900 dark:text-slate-100 resize-vertical"
              placeholder={
                isMultiple
                  ? 'e.g. ["item1", "item1", "item3"]'
                  : "Enter the static value to provide as input..."
              }
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isMultiple
                ? "Provide a valid JSON array. Each element will be processed."
                : "This value will be provided as input to connected tools"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
