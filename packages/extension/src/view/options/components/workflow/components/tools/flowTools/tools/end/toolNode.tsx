/**
 * External dependencies
 */
import { Handle, Position, useNodeId } from '@xyflow/react';
import { Flag } from 'lucide-react';

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
			className={`px-3 py-1.5 rounded-full border-2 bg-white flex items-center gap-2 shadow-sm transition-all duration-300 cursor-pointer ${
				selectedNode === nodeId
					? 'border-rose-500 ring-2 ring-rose-100'
					: 'border-slate-200 hover:border-rose-300'
			}`}
		>
			<Handle
				type="target"
				position={Position.Left}
				style={{
					background: 'none',
					border: 'none',
					top: '45%',
				}}
			>
				<div className="w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
			</Handle>

			<div className="p-1 rounded-full bg-rose-100 text-rose-600">
				<Flag size={12} fill="currentColor" />
			</div>
			<span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
				End
			</span>
		</button>
	);
};

export default ToolNode;
