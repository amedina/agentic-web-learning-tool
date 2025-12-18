import type { Meta, StoryObj } from '@storybook/react-vite';
import { withStore } from '../../../../../stories/StoreDecorator';
import ToolNode from './toolNode';

const meta = {
	title: 'Extension/Tools/BuiltinAI/SummarizerApi/ToolNode',
	component: ToolNode,
	parameters: {
		layout: 'centered',
		apiStore: {
			nodes: {
				'1': {
					type: 'summarizerApi',
					config: {
						title: 'Key Takeaways',
						context:
							'Generates a concise summary focusing on the most important points and action items.',
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
