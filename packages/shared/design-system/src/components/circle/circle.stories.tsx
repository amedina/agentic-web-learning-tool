/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import Circle from './';
import CircleEmpty from './circleEmpty';

const meta = {
  title: 'ui/Circle',
  component: Circle,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    color: { control: 'color' },
  },
  args: {
    color: '#4C79F4',
  },
} satisfies Meta<typeof Circle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Green: Story = {
  args: { color: '#5CC971' },
};

export const Empty: Story = {
  render: () => <CircleEmpty />,
};

export const EmptyCustomColor: Story = {
  render: () => <CircleEmpty color="#4C79F4" />,
};

export const Palette: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Circle color="#5CC971" />
      <Circle color="#F3AE4E" />
      <Circle color="#4C79F4" />
      <Circle color="#EC7159" />
      <CircleEmpty />
    </div>
  ),
};
