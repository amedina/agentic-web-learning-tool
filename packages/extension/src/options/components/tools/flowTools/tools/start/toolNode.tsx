/**
 * External dependencies
 */
import { Handle, Position, useNodeId } from '@xyflow/react';
import { Play } from 'lucide-react';

/**
 * Internal dependencies
 */
import { useApi } from '../../../../../store';

const ToolNode = () => {
	const nodeId = useNodeId();
	const { selectedNode, setSelectedNode } = useApi(({ state, actions }) => ({
		selectedNode: state.selectedNode,
		setSelectedNode: actions.setSelectedNode,
	}));

	return (
		<button
			onClick={() => nodeId && setSelectedNode(nodeId)}
			className={`px-3 py-1.5 rounded-full border-2 bg-white flex items-center gap-2 shadow-sm transition-all duration-300 cursor-pointer ${
				selectedNode === nodeId
					? 'border-emerald-500 ring-2 ring-emerald-100'
					: 'border-slate-200 hover:border-emerald-300'
			}`}
		>
			<div className="p-1 rounded-full bg-emerald-100 text-emerald-600">
				<Play size={12} fill="currentColor" />
			</div>
			<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
				<div className="w-2.5 h-2.5 bg-green-600 rounded-full border-2 border-white shadow-sm" />
			</Handle>
		</button>
	);
};

export default ToolNode;
