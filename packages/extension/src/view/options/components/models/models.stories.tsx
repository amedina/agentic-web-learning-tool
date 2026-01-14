/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { ModelsTab } from '..';

const meta = {
  title: 'Components/Models',
  component: ModelsTab,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ModelsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
