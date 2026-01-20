/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { withStore } from '../../../../stories/StoreDecorator';
import ToolNode from './toolNode';

const meta = {
  title: 'Extension/Tools/BuiltinAI/LanguageDetectorApi/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'languageDetectorApi',
          config: {
            title: 'Identify Language',
            description:
              'Analyzes input text to determine the source language (e.g., English, Spanish, Japanese).',
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
