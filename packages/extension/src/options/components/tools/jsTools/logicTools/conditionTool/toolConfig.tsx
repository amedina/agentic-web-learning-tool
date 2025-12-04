import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';
import { type NodeConfig } from '../../../../../store';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: () => Record<string, unknown>;
	}>;
	node: NodeConfig;
}

const COMPARISON_TYPES = [
	{ value: 'equals', label: 'Equals (==)' },
	{ value: 'not_equals', label: 'Not Equals (!=)' },
	{ value: 'contains', label: 'Contains' },
	{ value: 'not_contains', label: 'Does Not Contain' },
	{ value: 'starts_with', label: 'Starts With' },
	{ value: 'ends_with', label: 'Ends With' },
	{ value: 'greater_than', label: 'Greater Than (>)' },
	{ value: 'less_than', label: 'Less Than (<)' },
	{ value: 'greater_equal', label: 'Greater Than or Equal (>=)' },
	{ value: 'less_equal', label: 'Less Than or Equal (<=)' },
];

const ToolConfig = ({ ref, node }: ToolConfigProps) => {
	const [comparisonType, setComparisonType] = useState<string>(
		node.config.comparisonType || 'equals'
	);

	useEffect(() => {
		setComparisonType(node.config.comparisonType || 'equals');
	}, [node]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: () => ({
				comparisonType,
			}),
		}),
		[comparisonType]
	);

	return (
		<div className="space-y-6">
			<div className="bg-slate-100 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					Condition Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="comparisonType"
						>
							Comparison Type
						</label>
						<select
							id="comparisonType"
							value={comparisonType}
							onChange={(e) => setComparisonType(e.target.value)}
							className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
						>
							{COMPARISON_TYPES.map((type) => (
								<option key={type.value} value={type.value}>
									{type.label}
								</option>
							))}
						</select>
						<p className="text-xs text-slate-500 mt-1">
							Select the type of comparison to perform
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
