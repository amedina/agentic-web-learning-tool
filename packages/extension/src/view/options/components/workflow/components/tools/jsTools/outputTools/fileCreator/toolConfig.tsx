/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { FileDown } from 'lucide-react';
import z from 'zod';

export const FileCreatorSchema = z.object({
  filename: z.string().optional(),
});

export type FileCreatorConfig = z.infer<typeof FileCreatorSchema>;

interface ToolConfigProps {
  ref: React.Ref<{
    getConfig: (formData: FormData) => FileCreatorConfig | undefined;
  }>;
  config: FileCreatorConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
  const [filename, setFilename] = useState<string>(
    config?.filename || 'output.txt'
  );

  useEffect(() => {
    setFilename(config?.filename || 'output.txt');
  }, [config]);

  useImperativeHandle(
    ref,
    () => ({
      getConfig: (formData: FormData) => {
        const filename = formData.get('filename') as string;

        const configResult = {
          filename,
        };

        const validation = FileCreatorSchema.safeParse(configResult);
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
          <FileDown size={16} className="text-indigo-600" />
          File Creator Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-700 mb-2"
              htmlFor="filename"
            >
              Filename
            </label>
            <input
              type="text"
              id="filename"
              name="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
              placeholder="result.txt"
            />
            <p className="text-xs text-slate-500 mt-1">
              Name of the file to be downloaded
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolConfig;
