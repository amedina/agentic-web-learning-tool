import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';
import type { PromptApiConfig } from './promptApi';
import { PromptApiSchema } from './promptApi';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => PromptApiConfig | undefined;
	}>;
	config: PromptApiConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	const [topK, setTopK] = useState<number>(config.topK || 3);

	const [temperature, setTemperature] = useState<number>(
		config.temperature || 1
	);

	const [languageInput, setLanguageInput] = useState<string[]>(
		config.expectedInputsLanguages || []
	);

	const [languageOutput, setLanguageOutput] = useState<string[]>(
		config.expectedOutputsLanguages || []
	);

	const [initialPrompts, setInitialPrompts] = useState<string>(
		JSON.stringify(config.initialPrompts) || '[]'
	);

	useEffect(() => {
		setTopK(config.topK || 3);
		setTemperature(config.temperature || 0.7);
		setLanguageInput(config.expectedInputsLanguages || []);
		setLanguageOutput(config.expectedOutputsLanguages || []);
		setInitialPrompts(JSON.stringify(config.initialPrompts) || '[]');
	}, [config]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = formData.get('title') as string;
				const context = formData.get('context') as string;
				const topK = formData.get('topK') as string;
				const temperature = formData.get('temperature') as string;
				const languageInput = formData.getAll(
					'languageInput'
				) as string[];
				const languageOutput = formData.getAll(
					'languageOutput'
				) as string[];
				const initialPrompts = formData.get('initialPrompts') as string;
				let parsedInitialPrompts = [];

				try {
					parsedInitialPrompts = JSON.parse(initialPrompts);
				} catch (error) {
					console.error('Invalid JSON for initialPrompts:', error);
					return undefined;
				}

				const configResult = {
					title,
					context,
					topK: Number(topK),
					temperature: Number(temperature),
					expectedInputsLanguages: languageInput,
					expectedOutputsLanguages: languageOutput,
					initialPrompts: parsedInitialPrompts,
				};

				const validation = PromptApiSchema.safeParse(configResult);
				if (!validation.success) {
					console.error(
						'Configuration validation failed:',
						validation.error
					);
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
							value={initialPrompts}
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
