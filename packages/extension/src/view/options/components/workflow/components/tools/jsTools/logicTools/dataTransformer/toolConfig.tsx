/**
 * External dependencies
 */
import { useEffect, useImperativeHandle, useState } from 'react';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import {
	DataTransformerSchema,
	type DataTransformerConfig,
} from './dataTransformer';

interface ToolConfigProps {
	ref: React.Ref<{
		getConfig: (formData: FormData) => DataTransformerConfig | undefined;
	}>;
	config: DataTransformerConfig;
}

const ToolConfig = ({ ref, config }: ToolConfigProps) => {
	const [operation, setOperation] = useState(config.operation || 'format');

	useEffect(() => {
		setOperation(config.operation || 'format');
	}, [config]);

	useImperativeHandle(
		ref,
		() => ({
			getConfig: (formData: FormData) => {
				const title = (formData.get('title') as string) || '';
				const description =
					(formData.get('description') as string) || '';
				const op = formData.get(
					'operation'
				) as DataTransformerConfig['operation'];

				const configResult: Partial<DataTransformerConfig> = {
					title,
					description,
					operation: op,
				};

				switch (op) {
					case 'regex':
						configResult.pattern =
							(formData.get('pattern') as string) || '';
						configResult.flags =
							(formData.get('flags') as string) || '';
						break;
					case 'jsonParse':
						configResult.path =
							(formData.get('path') as string) || '';
						break;
					case 'format':
						configResult.formatType = formData.get(
							'formatType'
						) as DataTransformerConfig['formatType'];
						break;
					case 'split':
					case 'join':
						configResult.separator =
							(formData.get('separator') as string) || '';
						if (op === 'split')
							configResult.index =
								(formData.get('index') as string) || '0';
						break;
					case 'template':
						configResult.template =
							(formData.get('template') as string) || '';
						break;
					case 'filter':
						configResult.filterKey =
							(formData.get('filterKey') as string) || '';
						configResult.filterValue =
							(formData.get('filterValue') as string) || '';
						break;
					case 'map':
						configResult.mapPath =
							(formData.get('mapPath') as string) || '';
						break;
				}

				const validation =
					DataTransformerSchema.safeParse(configResult);
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
					Transformer Configuration
				</h3>

				<div className="space-y-4">
					<div>
						<label
							htmlFor="transformer-operation"
							className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-2"
						>
							Operation
						</label>
						<select
							id="transformer-operation"
							name="operation"
							value={operation}
							onChange={(e) =>
								setOperation(
									e.target
										.value as DataTransformerConfig['operation']
								)
							}
							className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
						>
							<option value="regex">Regex Extraction</option>
							<option value="jsonParse">JSON Parse / Path</option>
							<option value="format">
								Text Formatting (Case/Trim)
							</option>
							<option value="split">Split String</option>
							<option value="join">Join Array</option>
							<option value="template">Template Injection</option>
							<option value="filter">Filter Array</option>
							<option value="map">Map Array</option>
							<option value="objectKeys">Object Keys</option>
							<option value="objectValues">Object Values</option>
						</select>
					</div>

					<div className="p-3 bg-white border border-slate-200 rounded-md space-y-3">
						{operation === 'regex' && (
							<>
								<div>
									<label
										htmlFor="regex-pattern"
										className="block text-xs font-medium text-slate-700 mb-1"
									>
										Regex Pattern
									</label>
									<input
										id="regex-pattern"
										name="pattern"
										defaultValue={config.pattern}
										placeholder="e.g. (\d+)"
										className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
									/>
								</div>
								<div>
									<label
										htmlFor="regex-flags"
										className="block text-xs font-medium text-slate-700 mb-1"
									>
										Flags
									</label>
									<input
										id="regex-flags"
										name="flags"
										defaultValue={config.flags}
										placeholder="e.g. g, i"
										className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
									/>
								</div>
							</>
						)}

						{operation === 'jsonParse' && (
							<div>
								<label
									htmlFor="json-path"
									className="block text-xs font-medium text-slate-700 mb-1"
								>
									JSON Path
								</label>
								<input
									id="json-path"
									name="path"
									defaultValue={config.path}
									placeholder="e.g. data.user.name"
									className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
								/>
							</div>
						)}

						{operation === 'format' && (
							<div>
								<label
									htmlFor="format-type"
									className="block text-xs font-medium text-slate-700 mb-1"
								>
									Format Type
								</label>
								<select
									id="format-type"
									name="formatType"
									defaultValue={config.formatType}
									className="w-full p-2 border border-slate-200 rounded text-sm"
								>
									<option value="lowercase">Lowercase</option>
									<option value="uppercase">Uppercase</option>
									<option value="trim">
										Trim Whitespace
									</option>
									<option value="length">
										Get String Length
									</option>
								</select>
							</div>
						)}

						{(operation === 'split' || operation === 'join') && (
							<div className="space-y-3">
								<div>
									<label
										htmlFor="transformer-separator"
										className="block text-xs font-medium text-slate-700 mb-1"
									>
										Separator
									</label>
									<input
										id="transformer-separator"
										name="separator"
										defaultValue={config.separator}
										placeholder="e.g. , or ;"
										className="w-full p-2 border border-slate-200 rounded text-sm"
									/>
								</div>
								{operation === 'split' && (
									<div>
										<label
											htmlFor="split-index"
											className="block text-xs font-medium text-slate-700 mb-1"
										>
											Target Index
										</label>
										<input
											id="split-index"
											name="index"
											type="number"
											defaultValue={config.index}
											placeholder="0"
											className="w-full p-2 border border-slate-200 rounded text-sm"
										/>
									</div>
								)}
							</div>
						)}

						{operation === 'template' && (
							<div>
								<label
									htmlFor="transformer-template"
									className="block text-xs font-medium text-slate-700 mb-1"
								>
									Template
								</label>
								<textarea
									id="transformer-template"
									name="template"
									defaultValue={config.template}
									rows={3}
									placeholder="The result is: {{input}}"
									className="w-full p-2 border border-slate-200 rounded text-sm"
								/>
								<p className="text-[10px] text-slate-400 mt-1">
									Use {'{{input}}'} as a placeholder
								</p>
							</div>
						)}

						{operation === 'filter' && (
							<div className="space-y-3">
								<div>
									<label
										htmlFor="filter-key"
										className="block text-xs font-medium text-slate-700 mb-1"
									>
										Filter Key (Object Property)
									</label>
									<input
										id="filter-key"
										name="filterKey"
										defaultValue={config.filterKey}
										placeholder="e.g. status"
										className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
									/>
								</div>
								<div>
									<label
										htmlFor="filter-value"
										className="block text-xs font-medium text-slate-700 mb-1"
									>
										Filter Value (Matches)
									</label>
									<input
										id="filter-value"
										name="filterValue"
										defaultValue={config.filterValue}
										placeholder="e.g. active"
										className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
									/>
								</div>
							</div>
						)}

						{operation === 'map' && (
							<div>
								<label
									htmlFor="map-path"
									className="block text-xs font-medium text-slate-700 mb-1"
								>
									Map Path (Pick Property)
								</label>
								<input
									id="map-path"
									name="mapPath"
									defaultValue={config.mapPath}
									placeholder="e.g. user.id"
									className="w-full p-2 border border-slate-200 rounded text-sm font-mono"
								/>
							</div>
						)}

						{(operation === 'objectKeys' ||
							operation === 'objectValues') && (
							<div className="text-[10px] text-slate-500 italic">
								No additional configuration needed.
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ToolConfig;
