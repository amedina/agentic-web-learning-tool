/**
 * External dependencies
 */
import { useImperativeHandle } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import { LoopSchema, type LoopConfig } from './loopTool';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => LoopConfig | undefined;
	}>;
	config: LoopConfig;
}

const ToolConfig = ({ ref }: ToolConfigProps) => {
	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = formData.get('title') as string;
				const description = formData.get('description') as string;

				const configResult = {
					title,
					description,
				};

				const validation = LoopSchema.safeParse(configResult);
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
					Loop Configuration
				</h3>

				<div className="space-y-4">
					<p className="text-xs text-slate-500 italic">
						This node redirects all connections from the
						&quot;ITEM&quot; handle for each element in the input
						list. The &quot;DONE&quot; handle fires once the loop is
						completed.
					</p>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
