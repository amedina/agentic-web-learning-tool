/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import DetailsCard from './';
import Details from './details';

const meta = {
  title: 'ui/DetailsCard',
  component: DetailsCard,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 420, height: 520 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DetailsCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    hasContent: false,
    emptyText: 'Select an item to view details',
  },
};

export const EmptyDark: Story = {
  args: { ...Empty.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 420, height: 520, background: '#202124', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};

export const WithContent: Story = {
  args: {
    hasContent: true,
    children: (
      <Details
        sections={[
          { label: 'Category', content: 'Analytics' },
          { label: 'Origin', content: 'example.com' },
        ]}
        valueLabel="Value"
        value="GA1.2.123456789.1700000000"
        showUrlDecodeToggle
        descriptionLabel="Description"
        description="Tracks user session and pageviews."
      />
    ),
  },
};

export const WithContentDark: Story = {
  args: { ...WithContent.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 420, height: 520, background: '#202124', padding: 16 }}
      >
        <Story />
      </div>
    ),
  ],
};
