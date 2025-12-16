/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings, PenTool, Sparkles } from 'lucide-react';

/**
 * Internal dependencies
 */
import ToolItem from '.';

const meta = {
	title: 'ToolItem',
	component: ToolItem,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	argTypes: {
		onClick: { action: 'onClick' },
		Icon: { control: false },
	},
} as Meta<typeof ToolItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		label: 'Standard Tool',
		Icon: Settings,
	},
};

export const WithDifferentIcon: Story = {
	args: {
		label: 'AI Feature',
		Icon: Sparkles,
	},
};

export const LongLabel: Story = {
	args: {
		label: 'A Very Long Tool Label That Might Need Space',
		Icon: PenTool,
	},
};
