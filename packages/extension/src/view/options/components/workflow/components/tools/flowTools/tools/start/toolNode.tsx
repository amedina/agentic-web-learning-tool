/**
 * External dependencies
 */
import { Handle, Position, useNodeId } from '@xyflow/react';
import { Play } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useApi } from '../../../../../stateProviders';

const ToolNode = () => {
	const nodeId = useNodeId();
	const { selectedNode, setSelectedNode } = useApi(({ state, actions }) => ({
		selectedNode: state.selectedNode,
		setSelectedNode: actions.setSelectedNode,
	}));

	return (
		<button
			onClick={() => nodeId && setSelectedNode(nodeId)}
			className={`px-3 py-1.5 rounded-full border-2 bg-white dark:bg-slate-900 flex items-center gap-2 shadow-sm transition-all duration-300 cursor-pointer ${
				selectedNode === nodeId
					? 'border-emerald-500 dark:border-emerald-400 shadow-lg dark:shadow-emerald-500/20'
					: 'border-slate-200 dark:border-border hover:border-emerald-300 dark:hover:border-zinc-700'
			}`}
		>
			<div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-500">
				<Play size={12} fill="currentColor" />
			</div>
			<span className="text-xs font-bold text-slate-700 dark:text-foreground uppercase tracking-wider">
				Start
			</span>

			<Handle
				type="source"
				position={Position.Right}
				style={{
					background: 'none',
					border: 'none',
					top: '45%',
					right: '5px',
				}}
			>
				<div className="w-2.5 h-2.5 bg-green-600 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
			</Handle>
		</button>
	);
};

export default ToolNode;
