import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';
import { SummarizerApiSchema, type SummarizerApiConfig } from './summarizerApi';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => SummarizerApiConfig | undefined;
	}>;
	config: SummarizerApiConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	const [type, setType] = useState<string>(config.type || 'key-points');

	const [format, setFormat] = useState<string>(config.format || 'markdown');

	const [length, setLength] = useState<string>(config.length || 'short');

	const [inputLanguages, setInputLanguages] = useState<string[]>(
		config.expectedInputLanguages || []
	);

	const [outputLanguage, setOutputLanguage] = useState<string>(
		config.outputLanguage || 'es'
	);

	useEffect(() => {
		setType(config.type || 'key-points');
		setFormat(config.format || 'markdown');
		setLength(config.length || 'short');
		setInputLanguages(config.expectedInputLanguages || []);
		setOutputLanguage(config.outputLanguage || 'en');
	}, [config]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = formData.get('title') as string;
				const context = formData.get('context') as string;
				const type = formData.get('type') as string;
				const format = formData.get('format') as string;
				const length = formData.get('length') as string;
				const inputLanguages = formData.getAll(
					'inputLanguages'
				) as string[];
				const outputLanguage = formData.get('outputLanguage') as string;

				const configResult = {
					title,
					context,
					type,
					format,
					length,
					expectedInputLanguages: inputLanguages,
					outputLanguage,
				};

				const validation = SummarizerApiSchema.safeParse(configResult);
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
					Summarizer API Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="type"
						>
							Summary Type
						</label>
						<select
							name="type"
							id="type"
							value={type}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setType(e.target.value)}
						>
							<option value="key-points">Key Points</option>
							<option value="tldr">TL;DR</option>
							<option value="teaser">Teaser</option>
							<option value="headline">Headline</option>
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="format"
						>
							Output Format
						</label>
						<select
							name="format"
							id="format"
							value={format}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setFormat(e.target.value)}
						>
							<option value="markdown">Markdown</option>
							<option value="plain-text">Plain Text</option>
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="length"
						>
							Summary Length
						</label>
						<select
							name="length"
							id="length"
							value={length}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setLength(e.target.value)}
						>
							<option value="short">Short</option>
							<option value="medium">Medium</option>
							<option value="long">Long</option>
						</select>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="inputLanguages"
						>
							Input Languages
						</label>
						<select
							multiple
							name="inputLanguages"
							id="inputLanguages"
							value={inputLanguages}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) =>
								setInputLanguages(
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
						<p className="text-xs text-slate-500 mt-1">
							Hold Ctrl/Cmd to select multiple
						</p>
					</div>

					<div>
						<label
							className="block text-sm font-medium text-slate-700 mb-2"
							htmlFor="outputLanguage"
						>
							Output Language
						</label>
						<select
							name="outputLanguage"
							id="outputLanguage"
							value={outputLanguage}
							className="w-full p-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
							onChange={(e) => setOutputLanguage(e.target.value)}
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
