/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import APIPlaygroundsTab from './index';

const meta = {
  title: 'Components/APIPlaygrounds',
  component: APIPlaygroundsTab,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof APIPlaygroundsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
