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
  title: 'Extension/Tools/JSTools/OutputTools/FileCreator/ToolNode',
  component: ToolNode,
  parameters: {
    layout: 'centered',
    apiStore: {
      nodes: {
        '1': {
          type: 'fileCreator',
          config: {
            filename: 'export.json',
            description: 'Saves data to JSON',
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
