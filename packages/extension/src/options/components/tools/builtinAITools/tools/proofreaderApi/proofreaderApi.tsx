import { useCallback } from 'react';
import { BookCheck } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

const createConfig = () => {
	return {
		title: 'Proofreader API',
		context: 'You are a helpful proofreader', // TODO: Remove, no context required for proofreader
		expectedInputLanguages: ['en', 'ja', 'es'],
	};
};

const ProofreaderApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addProofreaderApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'proofreaderApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Proofreader API',
			},
		});

		addApiNode({
			id,
			type: 'proofreaderApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Proofreader API"
			onClick={addProofreaderApiNode}
			Icon={BookCheck}
		/>
	);
};

export default ProofreaderApi;
