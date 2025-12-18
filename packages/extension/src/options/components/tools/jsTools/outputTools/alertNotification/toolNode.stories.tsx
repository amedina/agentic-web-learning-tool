import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStore } from '../../../../../stories/StoreDecorator';
import ToolNode from './toolNode';

const meta = {
	title: 'Extension/Tools/JSTools/OutputTools/AlertNotification/ToolNode',
	component: ToolNode,
	parameters: {
		layout: 'centered',
		apiStore: {
			nodes: {
				'1': {
					type: 'alertNotification',
					config: {
						title: 'Show Success Toast',
						description:
							'Displays a popup notification in the browser to inform the user that the operation completed successfully.',
					},
				},
			},
		},
	},
	decorators: [withStore],
	tags: ['autodocs'],
} satisfies Meta<typeof ToolNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
