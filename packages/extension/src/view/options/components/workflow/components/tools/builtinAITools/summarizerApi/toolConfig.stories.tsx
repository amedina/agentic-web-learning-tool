/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ToolConfig from './toolConfig';

const meta = {
  title: 'Extension/Tools/BuiltinAI/SummarizerApi/ToolConfig',
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
      title: 'Summarizer API',
      context:
        'You are a helpful summarizer that focuses on extraction of key data points from financial documents.',
      type: 'key-points',
      format: 'markdown',
      length: 'medium',
      expectedInputLanguages: ['en', 'ja'],
      outputLanguage: 'en',
    },
  },
};
