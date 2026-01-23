/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import { DomInputSchema, type DomInputConfig } from './domInput';

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => DomInputConfig | undefined;
  }>;
  config: DomInputConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [cssSelector, setCssSelector] = useState<string>(
    config.cssSelector || 'body'
  );
  const [extract, setExtract] = useState<string>(
    config.extract || 'textContent'
  );
  const [defaultValue, setDefaultValue] = useState<string>(
    config.defaultValue || ''
  );
  const [isMultiple, setIsMultiple] = useState<boolean>(
    config.isMultiple || false
  );

  useEffect(() => {
    setCssSelector(config.cssSelector || 'body');
    setExtract(config.extract || 'textContent');
    setDefaultValue(config.defaultValue || '');
    setIsMultiple(config.isMultiple || false);
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const title = formData.get('title') as string;
        const cssSelector = formData.get('cssSelector') as string;
        const extract = formData.get('extract') as string;
        const defaultValue = formData.get('defaultValue') as string;
        const isMultiple = formData.get('isMultiple') === 'on';

        const configResult = {
          title,
          cssSelector,
          extract,
          defaultValue,
          isMultiple,
        };

        const validation = DomInputSchema.safeParse(configResult);
        if (!validation.success) {
          console.error('Invalid configuration:', validation.error);
          return undefined;
        }

        return validation.data;
      },
    }),
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-100 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={16} className="text-indigo-600" />
          DOM Input Configuration
        </h3>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md">
            <input
              type="checkbox"
              id="isMultiple"
              name="isMultiple"
              checked={isMultiple}
              onChange={(e) => setIsMultiple(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <div>
              <label
                htmlFor="isMultiple"
                className="text-sm font-medium text-slate-700"
              >
                Extract All Matching Elements
              </label>
              <p className="text-[10px] text-slate-500">
                Return an array of all matches
              </p>
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor="cssSelector"
            >
              CSS Selector
            </label>
            <input
              type="text"
              id="cssSelector"
              name="cssSelector"
              value={cssSelector}
              onChange={(e) => setCssSelector(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              placeholder="e.g., .content, #main, body"
            />
            <p className="text-xs text-slate-500 mt-1">
              CSS selector to target the DOM element
              {isMultiple && 's'}
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor="extract"
            >
              Extract Property
            </label>
            <select
              id="extract"
              name="extract"
              value={extract}
              onChange={(e) => setExtract(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
            >
              <option value="textContent">Text Content</option>
              <option value="innerHTML">Inner HTML</option>
              <option value="innerText">Inner Text</option>
              <option value="value">Input Value</option>
              <option value="src">Source URL</option>
              <option value="href">Link URL</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              What to extract from the selected element
              {isMultiple && 's'}
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor="defaultValue"
            >
              Default Value
            </label>
            <input
              type="text"
              id="defaultValue"
              name="defaultValue"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              placeholder="Fallback value if extraction fails"
            />
            <p className="text-xs text-slate-500 mt-1">
              Value to use if matching fails
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
