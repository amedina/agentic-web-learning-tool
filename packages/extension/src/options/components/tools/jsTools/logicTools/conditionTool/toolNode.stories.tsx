import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStore } from '../../../../../stories/StoreDecorator';
import ToolNode from './toolNode';

const meta = {
	title: 'Extension/Tools/JSTools/LogicTools/ConditionTool/ToolNode',
	component: ToolNode,
	parameters: {
		layout: 'centered',
		apiStore: {
			nodes: {
				'1': {
					type: 'conditionTool',
					config: {
						title: 'Check Language',
						description:
							'Redirects the workflow path based on whether input A matches the target language defined in input B.',
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
