/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import MatrixComponentHorizontal from './matrixComponentHorizontal';

const meta = {
  title: 'ui/Matrix/MatrixComponentHorizontal',
  component: MatrixComponentHorizontal,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 720, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatrixComponentHorizontal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Functional',
    description: 'Cookies required for core site functionality.',
    count: 12,
  },
};

export const Expanded: Story = {
  args: { ...Default.args, expand: true },
};

export const Dark: Story = {
  args: { ...Expanded.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 720, background: '#202124', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};
