/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { Pencil } from 'lucide-react';
import z from 'zod';

export const DomReplacementSchema = z.object({
  selector: z.string().min(1, 'Selector is required'),
  isMultiple: z.boolean().optional(),
});

export type DomReplacementConfig = z.infer<typeof DomReplacementSchema>;

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => DomReplacementConfig | undefined;
  }>;
  config: DomReplacementConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [selector, setSelector] = useState<string>(config?.selector || '');
  const [isMultiple, setIsMultiple] = useState<boolean>(
    config?.isMultiple || false
  );

  useEffect(() => {
    setSelector(config?.selector || '');
    setIsMultiple(config?.isMultiple || false);
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const selector = formData.get('selector') as string;
        const isMultiple = formData.get('isMultiple') !== null;

        const configResult = {
          selector,
          isMultiple,
        };

        const validation = DomReplacementSchema.safeParse(configResult);
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
          <Pencil size={16} className="text-indigo-600" />
          DOM Replacement Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
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
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              placeholder=".post-content, #main-title"
            />
            <p className="text-xs text-slate-500 mt-1">
              Selector of the element to replace content for
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMultiple"
              name="isMultiple"
              checked={isMultiple}
              onChange={(e) => setIsMultiple(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isMultiple"
              className="text-sm text-slate-700 select-none cursor-pointer"
            >
              Replace all matching elements
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
