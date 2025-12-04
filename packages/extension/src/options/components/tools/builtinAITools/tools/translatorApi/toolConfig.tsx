import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';
import { type NodeConfig } from '../../../../../store';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => void;
	}>;
	node: NodeConfig;
}

const ToolConfig = ({ ref, node }: ToolConfigProps) => {
	const [sourceLanguage, setSourceLanguage] = useState(
		node.config.sourceLanguage || 'en'
	);
	const [targetLanguage, setTargetLanguage] = useState(
		node.config.targetLanguage || 'es'
	);

	useEffect(() => {
		setSourceLanguage(node.config.sourceLanguage || 'en');
		setTargetLanguage(node.config.targetLanguage || 'es');
	}, [node]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const sourceLanguage = formData.get('sourceLanguage') as string;
				const targetLanguage = formData.get('targetLanguage') as string;

				return {
					sourceLanguage,
					targetLanguage,
				};
			},
		}),
		[]
	);
	return (
		<div className="space-y-6">
			<div className="bg-slate-100 rounded-lg p-4">
				<h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
					<Settings size={16} className="text-indigo-600" />
					Translator API Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="sourceLanguage"
						>
							Source Language
						</label>
						<select
							name="sourceLanguage"
							id="sourceLanguage"
							value={sourceLanguage}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setSourceLanguage(e.target.value)}
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="ja">Japanese</option>
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="targetLanguage"
						>
							Target Language
						</label>
						<select
							name="targetLanguage"
							id="targetLanguage"
							value={targetLanguage}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setTargetLanguage(e.target.value)}
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="ja">Japanese</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
