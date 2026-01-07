/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ToolConfig from './toolConfig';

const meta = {
	title: 'Extension/Tools/JSTools/OutputTools/DomReplacement/ToolConfig',
	component: ToolConfig,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
} as Meta<typeof ToolConfig>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		config: {
			selector: '.replace-me',
			isMultiple: false,
		},
	},
};

export const WithMultiple: Story = {
	args: {
		config: {
			selector: 'p.paragraph',
			isMultiple: true,
		},
	},
};

export const Empty: Story = {
	args: {
		config: {
			selector: '',
			isMultiple: false,
		},
	},
};
