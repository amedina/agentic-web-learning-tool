import type { Meta, StoryObj } from '@storybook/react-vite';
import ToolConfig from './toolConfig';

const meta = {
	title: 'Extension/Tools/BuiltinAI/PromptApi/ToolConfig',
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
			title: 'Analyze Financial Statement',
			context:
				'Extract key performance indicators (KPIs) and any mentioned risks from the provided financial statement.',
			topK: 5,
			temperature: 0.7,
			expectedInputsLanguages: ['en'],
			expectedOutputsLanguages: ['en'],
			initialPrompts: [
				{
					role: 'system',
					content: 'You are a professional financial analyst.',
				},
				{ role: 'user', content: 'Here is the statement to analyze.' },
			],
		},
	},
};
