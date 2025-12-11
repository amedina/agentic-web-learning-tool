import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useApi } from '../../store';
import {
	PromptApiToolConfig,
	ProofreaderApiToolConfig,
	RewriterApiToolConfig,
	SummarizerApiToolConfig,
	TranslatorApiToolConfig,
	WriterApiToolConfig,
} from '../tools/builtinAITools/tools';
import {
	DomInputToolConfig,
	StaticInputToolConfig,
} from '../tools/jsTools/inputTools';
import { ConditionToolConfig } from '../tools/jsTools/logicTools';

const TOOLS = {
	promptApi: PromptApiToolConfig,
	writerApi: WriterApiToolConfig,
	rewriterApi: RewriterApiToolConfig,
	proofreaderApi: ProofreaderApiToolConfig,
	translatorApi: TranslatorApiToolConfig,
	languageDetectorApi: null,
	summarizerApi: SummarizerApiToolConfig,
	alertNotification: null,
	domInput: DomInputToolConfig,
	condition: ConditionToolConfig,
	staticInput: StaticInputToolConfig,
};

const ToolsConfig = () => {
	const { selectedNode, getNode, updateNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			updateNode: actions.updateNode,
		})
	);

	const [node, setNode] = useState<ReturnType<typeof getNode>>();
	const [config, setConfig] = useState<any>();
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const toolNodeRef = useRef<{
		getConfig: (formData: FormData) => any;
	}>(null);

	useEffect(() => {
		if (selectedNode) {
			const _node = getNode(selectedNode);
			setNode(_node);
		} else {
			setNode(undefined);
		}
	}, [selectedNode, getNode]);

	useEffect(() => {
		setConfig(node?.config);
	}, [node]);

	const handleConfigUpdate = useCallback(
		(form: HTMLFormElement) => {
			const formData = new FormData(form);
			if (!node || !selectedNode) return;

			const toolConfig = toolNodeRef.current?.getConfig(formData);
			if (!toolConfig) {
				return;
			}

			updateNode(selectedNode, {
				config: toolConfig,
			});
		},
		[node, selectedNode, updateNode]
	);

	const handleChange = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			const form = e.currentTarget;

			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				handleConfigUpdate(form);
			}, 100);
		},
		[handleConfigUpdate]
	);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const Tool = node?.type
		? (TOOLS[node.type as keyof typeof TOOLS] as any)
		: null;

	return (
		<div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full">
			<div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
				<div className="flex items-center gap-2">
					<Settings size={20} className="text-slate-600" />
					<h2 className="font-semibold text-slate-800">
						Node Configuration
					</h2>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				{!selectedNode ? (
					<div className="p-8 text-center text-slate-500">
						<Settings
							size={48}
							className="mx-auto mb-4 text-slate-300"
						/>
						<p className="text-sm">
							Select a node to configure its settings
						</p>
					</div>
				) : (
					<form
						id="node-config-form"
						onChange={handleChange}
						onSubmit={(e) => e.preventDefault()}
						className="p-4 space-y-4"
					>
						<div className="bg-slate-100 rounded-lg p-3">
							<div className="text-xs text-slate-500 mb-1 uppercase tracking-wide">
								Node Type
							</div>
							<div className="text-sm font-medium text-slate-800 capitalize">
								{node?.type?.replace(/([A-Z])/g, ' $1').trim()}
							</div>
						</div>

						<div>
							<label
								className="block text-sm font-medium text-slate-700 mb-2"
								htmlFor="title"
							>
								Node Label
							</label>
							<input
								type="text"
								className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
								value={config?.title || ''}
								onChange={(e) => {
									setConfig((prev: any) => ({
										...prev,
										title: e.target.value,
									}));
								}}
								id="title"
								name="title"
								placeholder="Enter node label..."
							/>
						</div>

						<div>
							{config?.context ? (
								<>
									<label
										className="block text-sm font-medium text-slate-700 mb-2"
										htmlFor="context"
									>
										Context
									</label>
									<textarea
										className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white"
										rows={4}
										value={config?.context || ''}
										id="context"
										name="context"
										onChange={(e) =>
											setConfig((prev: any) => ({
												...prev,
												context: e.target.value,
											}))
										}
										placeholder="Enter context for the tool..."
									/>
								</>
							) : (
								<p className="text-sm text-slate-700 mb-2">
									{(node?.config as any)?.description}
								</p>
							)}
						</div>

						{Tool && node && (
							<Tool ref={toolNodeRef} config={node.config} />
						)}
					</form>
				)}
			</div>

			<div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
				<p>Changes are saved automatically</p>
			</div>
		</div>
	);
};

export default ToolsConfig;
