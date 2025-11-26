import { useImperativeHandle } from 'react';
import { useApi } from '../../../../../store';

interface ToolConfigProps {
	ref: React.Ref<{
		submit: (formData: FormData, nodeId: string) => void;
	}>;
}

const ToolConfig = ({ ref }: ToolConfigProps) => {
	const { updateNode } = useApi(({ actions }) => ({
		updateNode: actions.updateNode,
	}));

	useImperativeHandle(
		ref,
		() => ({
			submit: (formData: FormData, nodeId: string) => {
				const topK = formData.get('topK') as string;
				const temperature = formData.get('temperature') as string;
				const languageInput = formData.getAll(
					'languageInput'
				) as string[];
				const languageOutput = formData.getAll(
					'languageOutput'
				) as string[];
				const initialPrompts = formData.get('initialPrompts') as string;

				updateNode(nodeId, {
					config: {
						topK: Number(topK),
						temperature: Number(temperature),
						languageInput,
						languageOutput,
						initialPrompts: JSON.parse(initialPrompts),
					},
				});
			},
		}),
		[updateNode]
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
				defaultValue={'3'}
				name="topK"
				placeholder="Top K Value"
			/>
			<label className="block mb-2 mt-4" htmlFor="temperature">
				<span className="text-gray-300">Temperature:</span>
			</label>
			<input
				type="range"
				min={'1'}
				max={'2'}
				defaultValue={'1'}
				name="temperature"
				placeholder="Temperature Value"
			/>
			<label className="block mb-2 mt-4" htmlFor="languageInput">
				<span className="text-gray-300">
					Language Input (Multiple, Text Only):
				</span>
			</label>
			<select multiple name="languageInput" id="languageInput">
				<option value="en">English</option>
				<option value="es">Spanish</option>
				<option value="fr">French</option>
				{/* Add more options as needed */}
			</select>
			<label className="block mb-2 mt-4" htmlFor="languageOutput">
				<span className="text-gray-300">
					Language Output (Multiple, Text Only):
				</span>
			</label>
			<select multiple name="languageOutput" id="languageOutput">
				<option value="en">English</option>
				<option value="es">Spanish</option>
				<option value="fr">French</option>
				{/* Add more options as needed */}
			</select>
			<label className="block mb-2 mt-4" htmlFor="initialPrompts">
				<span className="text-gray-300">
					Initial Prompts (Role and Content):
				</span>
			</label>
			<textarea
				name="initialPrompts"
				placeholder='[{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "Hello"}]'
				rows={4}
			/>
		</>
	);
};

export default ToolConfig;
