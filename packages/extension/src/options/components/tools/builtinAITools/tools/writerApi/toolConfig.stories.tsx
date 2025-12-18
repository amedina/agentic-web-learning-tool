/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ToolConfig from './toolConfig';

const meta = {
	title: 'Extension/Tools/BuiltinAI/WriterApi/ToolConfig',
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
			title: 'Writer API',
			context:
				'Drafts marketing copy for new product launches based on a list of features.',
			tone: 'formal',
			format: 'markdown',
			length: 'medium',
			expectedInputLanguages: ['en'],
			outputLanguage: 'en',
		},
	},
};
