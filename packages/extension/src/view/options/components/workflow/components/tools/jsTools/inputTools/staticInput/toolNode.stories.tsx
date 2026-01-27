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
  title: 'Extension/Tools/JSTools/InputTools/StaticInput/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'staticInput',
          config: {
            title: 'Constant Value',
            description:
              'A manually entered string (e.g., "Hello World") that remains the same every time the workflow is executed.',
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
