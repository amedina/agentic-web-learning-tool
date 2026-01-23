/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies
 */
import ToolConfig from './toolConfig';

const meta = {
  title: 'Extension/Tools/JSTools/LogicTools/ConditionTool/ToolConfig',
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
      title: 'Is Price High?',
      description:
        'Checks if the extracted product price is greater than our budget threshold.',
      comparisonType: 'greater_than',
      comparisonValue: '100',
    },
  },
};
