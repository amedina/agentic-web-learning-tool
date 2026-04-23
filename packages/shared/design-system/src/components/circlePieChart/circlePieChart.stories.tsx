/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import CirclePieChart from './';

const meta = {
  title: 'ui/CirclePieChart',
  component: CirclePieChart,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 200, padding: 24 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CirclePieChart>;

export default meta;

type Story = StoryObj<typeof meta>;

const defaultData = [
  { count: 12, color: '#5CC971' },
  { count: 7, color: '#F3AE4E' },
  { count: 23, color: '#4C79F4' },
  { count: 4, color: '#EC7159' },
];

export const Default: Story = {
  args: {
    centerCount: 46,
    data: defaultData,
    title: 'Cookies',
  },
};

export const Empty: Story = {
  args: {
    centerCount: 0,
    data: [],
    title: 'No Cookies',
    tooltipText: 'Nothing to show yet',
  },
};

export const OverflowCount: Story = {
  args: {
    centerCount: 1234,
    data: defaultData,
    title: 'Large Count',
  },
};

export const WithTooltip: Story = {
  args: {
    centerCount: 15,
    data: defaultData.slice(0, 2),
    title: 'Hover to see tooltip',
    tooltipText: '12 functional, 3 marketing',
  },
};

export const Dark: Story = {
  args: { ...Default.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 200, background: '#202124', padding: 24 }}
      >
        <Story />
      </div>
    ),
  ],
};
