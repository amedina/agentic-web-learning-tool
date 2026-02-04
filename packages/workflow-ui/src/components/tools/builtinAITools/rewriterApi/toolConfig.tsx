/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { Settings } from "lucide-react";
import {
  RewriterApiConfigSchema,
  type RewriterApiConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => RewriterApiConfig | void;
  }>;
  config: RewriterApiConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [tone, setTone] = useState<string>(config.tone || "as-is");
  const [format, setFormat] = useState<string>(config.format || "as-is");

  const [length, setLength] = useState<string>(config.length || "as-is");

  const [inputLanguages, setInputLanguages] = useState<string[]>(
    config.expectedInputLanguages || [],
  );

  const [outputLanguage, setOutputLanguage] = useState<string>(
    config.outputLanguage || "es",
  );

  useEffect(() => {
    setTone(config.tone || "as-is");
    setFormat(config.format || "as-is");
    setLength(config.length || "as-is");
    setInputLanguages(config.expectedInputLanguages || []);
    setOutputLanguage(config.outputLanguage || "es");
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const context = formData.get("context") as string;
        const tone = formData.get("tone") as string;
        const format = formData.get("format") as string;
        const length = formData.get("length") as string;
        const inputLanguages = formData.getAll("inputLanguages") as string[];
        const outputLanguage = formData.get("outputLanguage") as string;

        const configResult = {
          title,
          context,
          tone,
          format,
          length,
          expectedInputLanguages: inputLanguages,
          outputLanguage,
        };

        const validation = RewriterApiConfigSchema.safeParse(configResult);
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
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4 border border-transparent dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Settings
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
          Rewriter API Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="tone"
            >
              Rewriting Tone
            </label>
            <select
              name="tone"
              id="tone"
              value={tone}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="more-formal" className="dark:bg-slate-900">
                More Formal
              </option>
              <option value="as-is" className="dark:bg-slate-900">
                As Is
              </option>
              <option value="more-casual" className="dark:bg-slate-900">
                More Casual
              </option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="format"
            >
              Output Format
            </label>
            <select
              name="format"
              id="format"
              value={format}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="as-is" className="dark:bg-slate-900">
                As Is
              </option>
              <option value="markdown" className="dark:bg-slate-900">
                Markdown
              </option>
              <option value="plain-text" className="dark:bg-slate-900">
                Plain Text
              </option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="length"
            >
              Content Length
            </label>
            <select
              name="length"
              id="length"
              value={length}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              onChange={(e) => setLength(e.target.value)}
            >
              <option value="shorter" className="dark:bg-slate-900">
                Shorter
              </option>
              <option value="as-is" className="dark:bg-slate-900">
                As Is
              </option>
              <option value="longer" className="dark:bg-slate-900">
                Longer
              </option>
            </select>
          </div>

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

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="outputLanguage"
            >
              Output Language
            </label>
            <select
              name="outputLanguage"
              id="outputLanguage"
              value={outputLanguage}
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              onChange={(e) => setOutputLanguage(e.target.value)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
