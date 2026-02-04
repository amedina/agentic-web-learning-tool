/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from "react";
import { Settings } from "lucide-react";
import {
  ConditionConfigSchema,
  type ConditionConfig,
} from "@google-awlt/engine-core";

/**
 * Internal dependencies
 */

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => ConditionConfig | undefined;
  }>;
  config: ConditionConfig;
}

const COMPARISON_TYPES = [
  { value: "equals", label: "Equals (==)" },
  { value: "not_equals", label: "Not Equals (!=)" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "starts_with", label: "Starts With" },
  { value: "ends_with", label: "Ends With" },
  { value: "greater_than", label: "Greater Than (>)" },
  { value: "less_than", label: "Less Than (<)" },
  { value: "greater_equal", label: "Greater Than or Equal (>=)" },
  { value: "less_equal", label: "Less Than or Equal (<=)" },
];

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [comparisonType, setComparisonType] = useState<string>(
    config.comparisonType || "equals",
  );

  useEffect(() => {
    setComparisonType(config.comparisonType || "equals");
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get("title") as string;
        const comparisonType = formData.get("comparisonType") as string;
        const comparisonValue = formData.get("comparisonValue") as string;

        const configResult = {
          title,
          comparisonType,
          comparisonValue,
        };

        const validation = ConditionConfigSchema.safeParse(configResult);
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
          <Settings
            size={16}
            className="text-indigo-600 dark:text-indigo-400"
          />
          Condition Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="comparisonType"
            >
              Comparison Type
            </label>
            <select
              id="comparisonType"
              name="comparisonType"
              value={comparisonType}
              onChange={(e) => setComparisonType(e.target.value)}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm bg-white dark:bg-slate-900 dark:text-slate-100"
            >
              {COMPARISON_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
              htmlFor="comparisonValue"
            >
              Comparison Value
            </label>
            <input
              type="text"
              id="comparisonValue"
              name="comparisonValue"
              defaultValue={config.comparisonValue || ""}
              placeholder="e.g. success, en, 100"
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm bg-white dark:bg-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              The static value to compare the input against
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
