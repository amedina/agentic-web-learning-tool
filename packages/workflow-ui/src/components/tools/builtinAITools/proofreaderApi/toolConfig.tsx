/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { Settings } from "lucide-react";
import {
  ProofreaderApiConfigSchema,
  type ProofreaderApiConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */
import logger from "../../../../logger";
interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => ProofreaderApiConfig | undefined;
  }>;
  config: ProofreaderApiConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [inputLanguages, setInputLanguages] = useState<string[]>(
    config.expectedInputLanguages || [],
  );

  useEffect(() => {
    setInputLanguages(config.expectedInputLanguages || []);
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const inputLanguages = formData.getAll("inputLanguages") as string[];

        const configResult = {
          title,
          expectedInputLanguages: inputLanguages,
        };

        const validation = ProofreaderApiConfigSchema.safeParse(configResult);
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
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4 border border-transparent dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Settings
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
          Proofreader API Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="inputLanguages"
            >
              Input Languages
            </label>
            <select
              multiple
              name="inputLanguages"
              id="inputLanguages"
              value={inputLanguages}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              onChange={(e) =>
                setInputLanguages(
                  Array.from(
                    e.target.selectedOptions,
                    (option) => option.value,
                  ),
                )
              }
            >
              <option value="en" className="dark:bg-slate-900">
                English
              </option>
              <option value="es" className="dark:bg-slate-900">
                Spanish
              </option>
              <option value="ja" className="dark:bg-slate-900">
                Japanese
              </option>
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
