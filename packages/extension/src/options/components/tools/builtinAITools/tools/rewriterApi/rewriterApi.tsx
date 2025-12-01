import { useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

const createConfig = () => {
	return {
		title: 'Rewriter API',
		context: 'You are a helpful re-writer',
		tone: 'as-is',
		format: 'as-is',
		length: 'as-is',
		expectedInputLanguages: ['en', 'ja', 'es'],
		expectedContextLanguages: ['en', 'ja', 'es'],
		outputLanguage: 'es',
	};
};

const RewriterApi = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addRewriterApiNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'rewriterApi',
			position: { x: 0, y: 0 },
			data: {
				label: 'Rewriter API',
			},
		});

		addApiNode({
			id,
			type: 'rewriterApi',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Rewriter API"
			onClick={addRewriterApiNode}
			Icon={RefreshCcw}
		/>
	);
};

export default RewriterApi;
