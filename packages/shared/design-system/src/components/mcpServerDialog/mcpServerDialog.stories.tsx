/**
 * External dependencies
 */
import type { MCPServerConfig } from '@google-awlt/common';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from '@storybook/test';
import { useState } from 'react';

/**
 * Internal dependencies
 */
import { MCPServerDialog } from './';

// --- Mock Data ---
const emptyConfig: MCPServerConfig = {
  transport: 'http',
  url: '',
  authToken: '',
  enabled: true,
  name: '',
};

const filledConfig: MCPServerConfig = {
  transport: 'http',
  url: 'http://localhost:8000/mcp',
  authToken: 'sk-1234567890',
  enabled: true,
  name: 'Production Python Server',
};

const meta: Meta<typeof MCPServerDialog> = {
  title: 'components/MCPServerDialog',
  component: MCPServerDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A dialog component for adding, editing, and validating MCP Server configurations.',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    onOpenChange: fn(),
    onSave: fn(),
    onDelete: fn(),
    open: false,
    validator: async (_config: MCPServerConfig, _name: string) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { isValid: true, errors: [] };
    },
  },
  argTypes: {
    server: {
      transport: {
        control: { type: 'select' },
        options: ['http', 'sse'],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const DialogWrapper = (args: Story['args']) => {
  const [isOpen, setIsOpen] = useState(args.open || false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    args.onOpenChange(open);
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
      >
        {args.serverId ? 'Edit Server' : 'Add New Server'}
      </button>
      <MCPServerDialog
        {...args}
        open={isOpen}
        onOpenChange={handleOpenChange}
      />
    </div>
  );
};

/**
 * Default state for adding a new server.
 * Validation will pass after 800ms.
 */
export const AddNewServer: Story = {
  render: (args: Story['args']) => <DialogWrapper {...args} />,
  args: {
    open: false,
    serverId: '',
    server: emptyConfig,
  },
};

/**
 * State for editing an existing server configuration.
 */
export const EditServer: Story = {
  render: (args: Story['args']) => <DialogWrapper {...args} />,
  args: {
    open: false,
    serverId: 'srv-123-abc',
    server: filledConfig,
  },
};

/**
 * Simulates a validation failure scenario.
 * The "Save" button should remain disabled even if "Validate" is clicked.
 */
export const ValidationFailure: Story = {
  render: (args: Story['args']) => <DialogWrapper {...args} />,
  args: {
    open: false,
    serverId: '',
    server: { ...emptyConfig, name: 'Invalid Server' },
    validator: async (_config: MCPServerConfig, _name: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        isValid: false,
        errors: ['Host unreachable', 'Invalid Auth Token'],
      };
    },
  },
};
