/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import Details from './details';

const meta = {
  title: 'ui/DetailsCard/Details',
  component: Details,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div style={{ width: 420, border: '1px solid #e0e0e0', padding: 8 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Details>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SectionsOnly: Story = {
  args: {
    sections: [
      {
        label: 'Exemption Reason',
        content: 'User explicitly allowed this origin.',
      },
      {
        label: 'Blocked Reason',
        content:
          'Cookie blocked because <b>SameSite=None</b> without <code>Secure</code>.',
        isHtml: true,
      },
      { label: 'Warnings', content: 'Will be deprecated in 2025.' },
    ],
  },
};

export const ValueWithUrlDecodeToggle: Story = {
  args: {
    valueLabel: 'Cookie Value',
    value: 'hello%20world%3D%7B%22session%22%3A%22abc%22%7D',
    showUrlDecodeToggle: true,
    urlDecodeLabel: 'URL Decoded',
  },
};

export const WithRows: Story = {
  args: {
    rows: [
      {
        icon: <span style={{ fontSize: 14 }}>●</span>,
        text: 'Blocked in all responses',
      },
      {
        icon: <span style={{ fontSize: 14 }}>○</span>,
        text: 'Allowed in some requests',
      },
    ],
  },
};

export const FullExample: Story = {
  args: {
    sections: [
      {
        label: 'Exemption Reason',
        content: 'User explicitly allowed this origin.',
      },
      {
        label: 'Blocked Reason',
        content: 'SameSite=None without Secure',
        isHtml: false,
      },
    ],
    rows: [{ icon: <span>●</span>, text: 'Blocked in all responses' }],
    valueLabel: 'Cookie Value',
    value: 'GA1.2.123456789.1700000000',
    showUrlDecodeToggle: true,
    descriptionLabel: 'Description',
    description: 'Tracks user session and pageviews across the site.',
  },
};

export const FullExampleDark: Story = {
  args: { ...FullExample.args },
  decorators: [
    (Story) => (
      <div
        className="dark"
        style={{ width: 420, background: '#202124', padding: 12 }}
      >
        <Story />
      </div>
    ),
  ],
};
