/**
 * External dependencies
 */
import { useMemo } from 'react';
import { Handle, Position, useNodeId } from '@xyflow/react';
import { Languages } from 'lucide-react';

/**
 * Internal dependencies
 */
import { ToolNodeContainer } from '../../../../ui';
import { useApi, useFlow } from '../../../../../stateProviders';
import type { TranslatorApiConfig } from './translatorApi';

const ToolNode = () => {
	const nodeId = useNodeId();
	const { getNode, selectedNode, setSelectedNode } = useApi(
		({ state, actions }) => ({
			selectedNode: state.selectedNode,
			getNode: actions.getNode,
			setSelectedNode: actions.setSelectedNode,
		})
	);

	const { nodes, deleteNode } = useFlow(({ state, actions }) => ({
		nodes: state.nodes,
		deleteNode: actions.deleteNode,
	}));

	const nodeStatus = useMemo(() => {
		return nodes.find((n) => n.id === nodeId)?.status;
	}, [nodes, nodeId]);

	const config = useMemo(() => {
		if (!nodeId) return undefined;

		const node = getNode(nodeId);

		if (!node) return undefined;

		const _config = node.config as TranslatorApiConfig;

		return {
			type: node?.type,
			title: _config.title,
			sourceLanguage: _config.sourceLanguage,
			targetLanguage: _config.targetLanguage,
		};
	}, [getNode, nodeId]);

	return (
		<ToolNodeContainer
			title={config?.title || ''}
			Icon={Languages}
			type={config?.type || ''}
			selected={selectedNode === nodeId}
			status={nodeStatus}
			onEdit={() => {
				setSelectedNode(nodeId);
			}}
			onRemove={() => {
				if (nodeId) {
					deleteNode(nodeId);
				}
			}}
		>
			<div className="h-fit w-full flex flex-col relative">
				<div className="w-full bg-linear-to-br from-blue-50 to-indigo-50 rounded-md p-3 my-2 border border-blue-100">
					<div className="flex justify-between items-center ">
						<p className="text-sm font-medium text-slate-500">
							Source Language
						</p>
						<p className="text-slate-700">
							{config?.sourceLanguage || 'Not set'}
						</p>
					</div>
					<div className="flex justify-between items-center">
						<p className="text-sm font-medium text-slate-500">
							Target Language
						</p>
						<p className="text-slate-700">
							{config?.targetLanguage || 'Not set'}
						</p>
					</div>
				</div>
				<Handle
					type="target"
					position={Position.Left}
					style={{
						background: 'none',
						border: 'none',
						top: '50%x',
						left: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute -translate-x-[30%] translate-y-[-50%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
					</div>
				</Handle>
				<Handle
					type="source"
					position={Position.Right}
					style={{
						background: 'none',
						border: 'none',
						top: '50%',
						right: '-10px',
					}}
				>
					<div className="flex items-center gap-2 w-fit absolute translate-y-[-50%] -translate-x-[10%] top-[2.5px]">
						<div className="min-w-3 h-3 bg-green-600 rounded-full shadow-sm"></div>
					</div>
				</Handle>
			</div>
		</ToolNodeContainer>
	);
};

export default ToolNode;
