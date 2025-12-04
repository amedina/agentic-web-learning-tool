import { useCallback } from 'react';
import { BellRing, NotebookTextIcon } from 'lucide-react';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

const AlertNotification = () => {
	const { addFlowNode } = useFlow(({ actions }) => ({
		addFlowNode: actions.addNode,
	}));

	const { addApiNode } = useApi(({ actions }) => ({
		addApiNode: actions.addNode,
	}));

	const addAlertNotificationNode = useCallback(() => {
		const id = new Date().getTime().toString();

		addFlowNode({
			id,
			type: 'alertNotification',
			position: { x: 0, y: 0 },
			data: {
				label: 'Alert Notification',
			},
		});

		addApiNode({
			id,
			type: 'alertNotification',
			config: {
				title: 'Alert Notification',
				context: 'An Alert notification for displaying output.',
			},
		});
	}, [addApiNode, addFlowNode]);

	return (
		<ToolItem
			label="Alert Notification"
			onClick={addAlertNotificationNode}
			Icon={BellRing}
		/>
	);
};

export default AlertNotification;
