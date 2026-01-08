import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgentStudioTab } from '..';

const meta = {
	title: 'Components/AgentStudio',
	component: AgentStudioTab,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof AgentStudioTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
