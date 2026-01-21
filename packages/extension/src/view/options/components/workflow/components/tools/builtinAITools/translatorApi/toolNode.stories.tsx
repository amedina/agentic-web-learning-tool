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
  title: 'Extension/Tools/BuiltinAI/TranslatorApi/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'translatorApi',
          config: {
            title: 'Translate to Spanish',
            description: 'Translate text to Spanish.',
            sourceLanguage: 'en',
            targetLanguage: 'es',
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
