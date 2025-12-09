import { useCallback } from 'react';
import { BellRing } from 'lucide-react';
import z from 'zod';
import { useApi, useFlow } from '../../../../../store';
import { ToolItem } from '../../../../ui';

export const AlertNotificationSchema = z.object({
	title: z.string(),
	description: z.string(),
});

const createConfig = () => {
	return {
		title: 'Alert Notification',
		description: 'An Alert notification for displaying output.',
	};
};

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
			config: createConfig(),
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
