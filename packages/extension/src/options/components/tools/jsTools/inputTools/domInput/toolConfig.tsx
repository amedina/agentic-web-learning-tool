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
	const [cssSelector, setCssSelector] = useState<string>(
		node.config.cssSelector || 'body'
	);
	const [extract, setExtract] = useState<string>(
		node.config.extract || 'textContent'
	);
	const [defaultValue, setDefaultValue] = useState<string>(
		node.config.defaultValue || ''
	);

	useEffect(() => {
		setCssSelector(node.config.cssSelector || 'body');
		setExtract(node.config.extract || 'textContent');
		setDefaultValue(node.config.defaultValue || '');
	}, [node]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: () => ({
				cssSelector,
				extract,
				defaultValue,
			}),
		}),
		[cssSelector, extract, defaultValue]
	);

	return (
		<div className="space-y-6">
			<div className="bg-slate-100 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					DOM Input Configuration
				</h3>

				<div className="space-y-4">
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
							value={cssSelector}
							onChange={(e) => setCssSelector(e.target.value)}
							className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
							placeholder="e.g., .content, #main, body"
						/>
						<p className="text-xs text-slate-500 mt-1">
							CSS selector to target the DOM element
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
							value={defaultValue}
							onChange={(e) => setDefaultValue(e.target.value)}
							className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
							placeholder="Fallback value if extraction fails"
						/>
						<p className="text-xs text-slate-500 mt-1">
							Value to use if the element is not found or
							extraction fails
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
