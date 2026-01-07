/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { withStore } from '../../../../../stories/storeDecorator';
import ToolNode from './toolNode';

const meta = {
	title: 'Extension/Tools/FlowTools/End/ToolNode',
	component: ToolNode,
	parameters: {
		layout: 'centered',
		apiStore: {
			nodes: {
				'1': {
					type: 'end',
					config: {},
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
