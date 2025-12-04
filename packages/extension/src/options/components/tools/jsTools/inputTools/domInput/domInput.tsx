import { useCallback } from 'react';
import { FileSearch } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

const createConfig = () => {
	return {
		title: 'DOM Input',
		context: 'Extract text content from the DOM element.',
		cssSelector: 'body',
		extract: 'textContent',
		defaultValue: 'Test',
	};
};

const DomInput = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addDomInputNode = useCallback(() => {
		const config = createConfig();
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'domInput',
			position: { x: 0, y: 0 },
			data: {
				label: 'Dom Input',
			},
		});

		addApiNode({
			id,
			type: 'domInput',
			config,
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Dom Input"
			onClick={addDomInputNode}
			Icon={FileSearch}
		/>
	);
};

export default DomInput;
