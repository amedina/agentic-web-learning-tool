/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings } from 'lucide-react';

/**
 * Internal dependencies
 */
import ToolNodeContainer from '.';

const meta = {
	title: 'Extension/ToolNodeContainer',
	component: ToolNodeContainer,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		onEdit: { action: 'onEdit' },
		onRemove: { action: 'onRemove' },
		Icon: { control: false },
	},
} as Meta<typeof ToolNodeContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: 'Translator Node',
		type: 'translatorApi',
		Icon: Settings,
		selected: false,
		children: (
			<div className="p-4 text-sm text-gray-500">
				Node Content Goes Here
			</div>
		),
	},
};

export const Selected: Story = {
	args: {
		...Default.args,
		selected: true,
	},
};

export const LongTitle: Story = {
	args: {
		...Default.args,
		title: 'Very Long Node Title That Wrap In Two Lines',
	},
};
