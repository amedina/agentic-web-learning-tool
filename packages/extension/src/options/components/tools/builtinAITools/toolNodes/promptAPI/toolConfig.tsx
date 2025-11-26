import { useEffect, useImperativeHandle, useState } from 'react';
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

	const [initialPrompts, setInitialPrompts] = useState<string>(
		node.config.initialPrompts || '[]'
	);

	useEffect(() => {
		setTopK(node.config.topK || 3);
		setTemperature(node.config.temperature || 1);
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
					initialPrompts: initialPrompts || '[]',
				};
			},
		}),
		[]
	);

	return (
		<>
			<label className="block mb-2 mt-4" htmlFor="topK">
				<span className="text-gray-300">Top K:</span>
			</label>
			<input
				type="range"
				min={'1'}
				max={'128'}
				value={topK}
				name="topK"
				placeholder="Top K Value"
				onChange={(e) => setTopK(Number(e.target.value))}
			/>
			<label className="block mb-2 mt-4" htmlFor="temperature">
				<span className="text-gray-300">Temperature:</span>
			</label>
			<input
				type="range"
				min={'1'}
				max={'2'}
				value={temperature}
				name="temperature"
				placeholder="Temperature Value"
				onChange={(e) => setTemperature(Number(e.target.value))}
			/>
			<label className="block mb-2 mt-4" htmlFor="languageInput">
				<span className="text-gray-300">
					Language Input (Multiple, Text Only):
				</span>
			</label>
			<select
				multiple
				name="languageInput"
				id="languageInput"
				value={languageInput}
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
			</select>
			<label className="block mb-2 mt-4" htmlFor="languageOutput">
				<span className="text-gray-300">
					Language Output (Multiple, Text Only):
				</span>
			</label>
			<select
				multiple
				name="languageOutput"
				id="languageOutput"
				value={languageOutput}
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
			</select>
			<label className="block mb-2 mt-4" htmlFor="initialPrompts">
				<span className="text-gray-300">
					Initial Prompts (Role and Content):
				</span>
			</label>
			<div>
				<textarea
					name="initialPrompts"
					placeholder='[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello"}]'
					rows={4}
					value={JSON.stringify(initialPrompts, null, 2)}
					onChange={(e) => setInitialPrompts(e.target.value)}
				/>
			</div>
		</>
	);
};

export default ToolConfig;
