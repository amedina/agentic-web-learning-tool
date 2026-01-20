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
  title: 'Extension/Tools/BuiltinAI/WriterApi/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'writerApi',
          config: {
            title: 'Draft Action Plan',
            context:
              'Create a detailed step-by-step action plan based on the meeting notes provided.',
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
