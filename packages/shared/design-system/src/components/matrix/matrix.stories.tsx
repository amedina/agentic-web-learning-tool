/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import Matrix from './';

const meta = {
  title: 'ui/Matrix',
  component: Matrix,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 640, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Matrix>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseData = [
  {
    title: 'Functional',
    count: 12,
    color: '#5CC971',
    countClassName: 'text-[#5CC971]',
  },
  {
    title: 'Marketing',
    count: 7,
    color: '#F3AE4E',
    countClassName: 'text-[#F3AE4E]',
  },
  {
    title: 'Analytics',
    count: 23,
    color: '#4C79F4',
    countClassName: 'text-[#4C79F4]',
  },
  {
    title: 'Uncategorized',
    count: 4,
    color: '#EC7159',
    countClassName: 'text-[#EC7159]',
  },
];

export const Default: Story = {
  args: { dataComponents: baseData },
};

export const Expanded: Story = {
  args: {
    expand: true,
    dataComponents: baseData.map((data) => ({
      ...data,
      description: `<em>${data.title}</em> cookies grouped by primary purpose.`,
    })),
  },
};

export const Interactive: Story = {
  args: {
    dataComponents: baseData.map((data) => ({
      ...data,
      onClick: (title: string) => alert(`Clicked ${title}`),
    })),
  },
};

export const Dark: Story = {
  args: { dataComponents: baseData },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 640, background: '#202124', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};
