import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, Settings, X } from 'lucide-react';
import { useApi } from '../../store';
import {
	PromptApiToolConfig,
	ProofreaderApiToolConfig,
	RewriterApiToolConfig,
	SummarizerApiToolConfig,
	TranslatorApiToolConfig,
	WriterApiToolConfig,
} from '../tools/builtinAITools/tools';

const TOOLS = {
	promptApi: PromptApiToolConfig,
	writerApi: WriterApiToolConfig,
	rewriterApi: RewriterApiToolConfig,
	proofreaderApi: ProofreaderApiToolConfig,
	translatorApi: TranslatorApiToolConfig,
	languageDetectorApi: null,
	summarizerApi: SummarizerApiToolConfig,
};

const ToolsConfig = () => {
	const { selectedNode, getNode, updateNode, setSelectedNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			updateNode: actions.updateNode,
			setSelectedNode: actions.setSelectedNode,
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

			setSelectedNode(null);
		},
		[node, selectedNode, setSelectedNode, updateNode]
	);

	const Tool = node?.type ? TOOLS[node?.type] : null;

	if (!selectedNode) return null;

	return (
		<>
			<button
				className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
				onClick={() => setSelectedNode(null)}
			/>

			<form
				className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col"
				onSubmit={handleSubmit}
			>
				<div className="flex items-center justify-between p-4 border-b border-slate-200 bg-indigo-50">
					<div className="flex items-center gap-2">
						<Settings size={20} className="text-indigo-600" />
						<h2 className="font-semibold text-slate-800">
							Node Settings
						</h2>
					</div>
					<button
						onClick={() => setSelectedNode(null)}
						className="p-1 hover:bg-indigo-100 rounded text-slate-600 hover:text-slate-800 transition-colors"
					>
						<X size={20} />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					<div className="bg-slate-100 rounded p-3">
						<div className="text-xs text-slate-500 mb-1">
							Node Type
						</div>
						<div className="text-sm font-medium text-slate-800 capitalize">
							{node?.type}
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
							className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 text-sm"
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
							className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:border-indigo-500 text-sm resize-none"
							rows={3}
							value={context || ''}
							id="context"
							name="context"
							onChange={(e) => setContext(e.target.value)}
							placeholder="Enter context for the tool..."
						/>
					</div>

					{Tool && <Tool ref={toolNodeRef} node={node} />}
				</div>

				<div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
					<button
						type="submit"
						className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm font-medium"
					>
						Save Changes <Save size={16} className="inline ml-1" />
					</button>
				</div>
			</form>
		</>
	);
};

export default ToolsConfig;
