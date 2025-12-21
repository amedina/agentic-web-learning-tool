/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import { ToolFallback } from './';

const meta: Meta<typeof ToolFallback> = {
  title: 'ui/ToolFallback',
  component: ToolFallback,
  tags: ['autodocs'],
  // Decorator to apply the "Warm Paper" background
  decorators: [
    (Story) => (
      <div className="bg-[#FBFBF9] dark:bg-black p-8 min-h-[400px] w-full flex justify-center">
        <div className="w-full max-w-2xl">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToolFallback>;

// 1. Pending State (Loading)
export const Processing: Story = {
  args: {
    toolName: 'read_file_system',
    status: { type: 'running' },
    args: {
      path: './src/components',
      recursive: true,
      encoding: 'utf-8'
    },
  },
};

// 2. Success State (Simple Output)
export const SuccessfulCall: Story = {
  args: {
    toolName: 'calculate_mortgage',
    status: { type: 'complete' },
    args: {
      principal: 300000,
      rate: 3.5,
      years: 30
    },
    result: {
      monthly_payment: 1347.13,
      total_interest: 184968.23
    },
  },
};

// 3. Error State
export const FailedAction: Story = {
  args: {
    toolName: 'api_request',
    status: { type: 'incomplete', reason: 'error' },
    args: {
      endpoint: 'https://api.example.com/v1/users',
      method: 'POST'
    },
    result: "Error 500: Internal Server Error - Connection timed out after 30000ms",
  },
};

// 4. Large Data (Stress Test)
export const LargeDataPayload: Story = {
  args: {
    toolName: 'scrape_website',
    status: { type: 'complete' },
    args: {
      url: 'https://example.com',
      selectors: ['p', 'div.content', 'article']
    },
    result: {
      metadata: {
        title: 'Example Domain',
        charset: 'utf-8'
      },
      content: Array(20).fill("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.").join("\n"),
      links: Array(10).fill({ text: "Click here", href: "#" })
    },
  },
};

// 5. String Result (Not JSON)
export const StringOutput: Story = {
  args: {
    toolName: 'generate_uuid',
    status: { type: 'complete' },
    args: { version: 4 },
    result: "550e8400-e29b-41d4-a716-446655440000",
  },
};