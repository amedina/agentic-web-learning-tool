/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { CommandCard } from './index';
import type { PromptCommand } from '../types';

const meta: Meta<typeof CommandCard> = {
  title: 'Components/PromptCommands/CommandCard',
  component: CommandCard,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof CommandCard>;

const sampleCommand: PromptCommand = {
  name: 'react-tutor',
  instructions: 'You are a react tutor...',
  description: 'Helps you learn React.',
  isBuiltIn: false,
  enabled: true,
};

export const UserCommand: Story = {
  args: {
    command: sampleCommand,
    onToggle: () => {},
    onEdit: () => {},
  },
};

export const BuiltInCommand: Story = {
  args: {
    command: {
      ...sampleCommand,
      isBuiltIn: true,
      name: 'fix-bugs',
      description: 'Fix bugs in code.',
    },
    onToggle: () => {},
    onEdit: () => {},
  },
};
