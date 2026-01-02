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
	title: 'Extension/Tools/JSTools/InputTools/DomInput/ToolNode',
	component: ToolNode,
	parameters: {
		layout: 'centered',
		apiStore: {
			nodes: {
				'1': {
					type: 'domInput',
					config: {
						title: 'Extract Page Title',
						description:
							'Selects the <h1> or <title> element from the current webpage to use as a dynamic input for the workflow.',
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
