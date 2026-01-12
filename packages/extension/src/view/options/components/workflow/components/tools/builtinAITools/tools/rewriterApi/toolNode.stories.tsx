/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import { withStore } from '../../../../../stories/providerDecorator';
import ToolNode from './toolNode';

const meta = {
  title: 'Extension/Tools/BuiltinAI/RewriterApi/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'rewriterApi',
          config: {
            title: 'Professional Rephrase',
            context:
              'Rewrites the input text to sound more formal and suitable for professional business communications.',
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
