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
	const [topK, setTopK] = useState<number>(node.config.topK || 3);

	const [temperature, setTemperature] = useState<number>(
		node.config.temperature || 1
	);

	const [languageInput, setLanguageInput] = useState<string[]>(
		node.config.languageInput || []
	);

	const [languageOutput, setLanguageOutput] = useState<string[]>(
		node.config.languageOutput || []
	);

	const [initialPrompts, setInitialPrompts] = useState<
		{ role: string; content: string }[]
	>(node.config.initialPrompts || '[]');

	useEffect(() => {
		setTopK(node.config.topK || 3);
		setTemperature(node.config.temperature || 0.7);
		setLanguageInput(node.config.expectedInputs?.[0]?.languages || []);
		setLanguageOutput(node.config.expectedOutputs?.[0]?.languages || []);
		setInitialPrompts(node.config.initialPrompts || '[]');
	}, [node]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const topK = formData.get('topK') as string;
				const temperature = formData.get('temperature') as string;
				const languageInput = formData.getAll(
					'languageInput'
				) as string[];
				const languageOutput = formData.getAll(
					'languageOutput'
				) as string[];
				const initialPrompts = formData.get('initialPrompts') as string;

				return {
					topK: Number(topK),
					temperature: Number(temperature),
					expectedInputs: [
						{
							type: 'text',
							languages: languageInput,
						},
					],
					expectedOutputs: [
						{
							type: 'text',
							languages: languageOutput,
						},
					],
					initialPrompts: initialPrompts,
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
					Prompt API Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="topK"
						>
							Top K:{' '}
							<span className="text-slate-500 font-normal">
								{topK}
							</span>
						</label>
						<input
							type="range"
							min="1"
							max="128"
							value={topK}
							name="topK"
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
							onChange={(e) => setTopK(Number(e.target.value))}
						/>
						<div className="flex justify-between text-xs text-slate-500 mt-1">
							<span>1</span>
							<span>128</span>
						</div>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="temperature"
						>
							Temperature:{' '}
							<span className="text-slate-500 font-normal">
								{temperature}
							</span>
						</label>
						<input
							type="range"
							min="0"
							max="2"
							step="0.1"
							value={temperature}
							name="temperature"
							className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
							onChange={(e) =>
								setTemperature(Number(e.target.value))
							}
						/>
						<div className="flex justify-between text-xs text-slate-500 mt-1">
							<span>0</span>
							<span>2</span>
						</div>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="languageInput"
						>
							Input Languages (Text Only)
						</label>
						<select
							multiple
							name="languageInput"
							id="languageInput"
							value={languageInput}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) =>
								setLanguageInput(
									Array.from(
										e.target.selectedOptions,
										(option) => option.value
									)
								)
							}
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="ja">Japanese</option>
							<option value="fr">French</option>
							<option value="de">German</option>
						</select>
						<p className="text-xs text-slate-500 mt-1">
							Hold Ctrl/Cmd to select multiple
						</p>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="languageOutput"
						>
							Output Languages (Text Only)
						</label>
						<select
							multiple
							name="languageOutput"
							id="languageOutput"
							value={languageOutput}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) =>
								setLanguageOutput(
									Array.from(
										e.target.selectedOptions,
										(option) => option.value
									)
								)
							}
						>
							<option value="en">English</option>
							<option value="es">Spanish</option>
							<option value="ja">Japanese</option>
							<option value="fr">French</option>
							<option value="de">German</option>
						</select>
						<p className="text-xs text-slate-500 mt-1">
							Hold Ctrl/Cmd to select multiple
						</p>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="initialPrompts"
						>
							Initial Prompts (JSON Array)
						</label>
						<textarea
							name="initialPrompts"
							placeholder='[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello"}]'
							rows={6}
							value={(initialPrompts, null, 2)}
							className="w-full p-3 border border-slate-300 rounded-md bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-vertical"
							onChange={(e) => {
								try {
									setInitialPrompts(e.target.value);
								} catch {
									// Invalid JSON, keep previous value
								}
							}}
						/>
						<p className="text-xs text-slate-500 mt-1">
							Enter prompts as JSON array with role and content
							fields
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
