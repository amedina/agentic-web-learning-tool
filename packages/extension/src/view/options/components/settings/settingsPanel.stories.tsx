import type { Meta, StoryObj } from '@storybook/react-vite';
import { SettingsTab } from '..';

const meta = {
	title: 'Components/SettingsTab',
	component: SettingsTab,
	parameters: {
		layout: 'fullscreen',
	},
	tags: ['autodocs'],
} satisfies Meta<typeof SettingsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
};
