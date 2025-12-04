import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';
import { type NodeConfig } from '../../../../../store';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: () => Record<string, unknown>;
	}>;
	node: NodeConfig;
}

const ToolConfig = ({ ref, node }: ToolConfigProps) => {
	const [inputValue, setInputValue] = useState<string>(
		node.config.inputValue || ''
	);

	useEffect(() => {
		setInputValue(node.config.inputValue || '');
	}, [node]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: () => ({
				inputValue,
			}),
		}),
		[inputValue]
	);

	return (
		<div className="space-y-6">
			<div className="bg-slate-100 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					Static Input Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="inputValue"
						>
							Input Value
						</label>
						<textarea
							id="inputValue"
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							rows={4}
							className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white resize-vertical"
							placeholder="Enter the static value to provide as input..."
						/>
						<p className="text-xs text-slate-500 mt-1">
							This value will be provided as input to connected
							tools
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
