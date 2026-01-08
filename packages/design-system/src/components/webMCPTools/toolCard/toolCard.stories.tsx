/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { ToolCard } from '.';
import type { WebMCPTool } from '../types';

const meta: Meta<typeof ToolCard> = {
  title: 'Components/WebMCPTools/ToolCard',
  component: ToolCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ToolCard>;

const sampleTool: WebMCPTool = {
  name: 'example_tool',
  namespace: 'user_scripts',
  description:
    'An example tool description that is long enough to demonstrate wrapping.',
  allowedDomains: ['<all_urls>', 'https://example.com/*'],
  inputSchema: {},
  enabled: true,
  isBuiltIn: false,
};

export const UserTool: Story = {
  args: {
    tool: sampleTool,
    onToggle: () => {},
    onEdit: () => {},
  },
};

export const BuiltInTool: Story = {
  args: {
    tool: { ...sampleTool, isBuiltIn: true, namespace: 'built_in' },
    onToggle: () => {},
  },
};
