import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Settings } from 'lucide-react';
import { useApi } from '../../store';
import {
	PromptApiToolConfig,
	ProofreaderApiToolConfig,
	RewriterApiToolConfig,
	SummarizerApiToolConfig,
	TranslatorApiToolConfig,
	WriterApiToolConfig,
} from '../tools/builtinAITools/tools';
import { DomInputToolConfig } from '../tools/jsTools/inputTools';
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
	const [title, setTitle] = useState<string>(node?.config.title || '');
	const [context, setContext] = useState<string>(node?.config.context || '');

	const toolNodeRef = useRef<{
		getConfig: (formData: FormData) => void;
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
		setTitle(node?.config.title || '');
		setContext(node?.config.context || '');
	}, [node]);

	const handleSubmit = useCallback(
		(e: React.FormEvent<HTMLFormElement>) => {
			const formData = new FormData(e.currentTarget);
			e.preventDefault();

			if (!node || !selectedNode) return;

			const title = formData.get('title') as string;
			const context = formData.get('context') as string;

			updateNode(selectedNode, {
				...node,
				config: {
					...node.config,
					title,
					context,
					...(toolNodeRef.current
						? toolNodeRef.current.getConfig(formData)
						: {}),
				},
			});
		},
		[node, selectedNode, updateNode]
	);

	const Tool = node?.type ? TOOLS[node.type as keyof typeof TOOLS] : null;

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
						onSubmit={handleSubmit}
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
								value={title}
								onChange={(e) => {
									setTitle(e.target.value);
								}}
								id="title"
								name="title"
								placeholder="Enter node label..."
							/>
						</div>

						<div>
							<label
								className="block text-sm font-medium text-slate-700 mb-2"
								htmlFor="context"
							>
								Context
							</label>
							<textarea
								className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none bg-white"
								rows={4}
								value={context || ''}
								id="context"
								name="context"
								onChange={(e) => setContext(e.target.value)}
								placeholder="Enter context for the tool..."
							/>
						</div>

						{Tool && node && <Tool ref={toolNodeRef} node={node} />}
					</form>
				)}
			</div>

			<div className="p-4 border-t border-slate-200 bg-white">
				<button
					type="submit"
					form={selectedNode ? 'node-config-form' : undefined}
					disabled={!selectedNode}
					className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center gap-2"
				>
					<Save size={16} />
					Save Configuration
				</button>
			</div>
		</div>
	);
};

export default ToolsConfig;
