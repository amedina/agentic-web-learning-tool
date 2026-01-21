/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ToolConfig from './toolConfig';

const meta = {
  title: 'Extension/Tools/BuiltinAI/TranslatorApi/ToolConfig',
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
      title: 'Translator API',
      description:
        'Translates technical documentation while preserving technical terminology.',
      sourceLanguage: 'en',
      targetLanguage: 'ja',
    },
  },
};
