/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import MatrixComponent from './';

const meta = {
  title: 'ui/Matrix/MatrixComponent',
  component: MatrixComponent,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MatrixComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    color: '#4C79F4',
    title: 'Analytics',
    count: 23,
    countClassName: 'text-[#4C79F4] text-xxl leading-none',
  },
};

export const Expanded: Story = {
  args: {
    ...Default.args,
    isExpanded: true,
    description: 'Analytics cookies track <b>site usage</b> and pageviews.',
  },
};

export const Dark: Story = {
  args: { ...Expanded.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 280, background: '#202124', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};
