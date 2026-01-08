/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { CommandList } from './index';
import type { PromptCommand } from '../types';

const meta: Meta<typeof CommandList> = {
	title: 'Components/PromptCommands/CommandList',
	component: CommandList,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		(Story) => (
			<div className="min-h-screen min-w-screen p-10">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof CommandList>;

const sampleUserCommand: PromptCommand = {
	name: 'user_command',
	instructions: 'User command instructions...',
	description: 'A user defined command.',
	isBuiltIn: false,
	enabled: true,
};

const sampleBuiltInCommand: PromptCommand = {
	name: 'built_in_command',
	instructions: 'Built-in instructions...',
	description: 'A built-in command.',
	isBuiltIn: true,
	enabled: true,
};

export const Default: Story = {
	args: {
		userCommands: [sampleUserCommand],
		builtInCommands: [sampleBuiltInCommand],
		onToggleCommand: () => {},
		onEditCommand: () => {},
		onNewCommand: () => {},
	},
};

export const EmptyUserCommands: Story = {
	args: {
		userCommands: [],
		builtInCommands: [sampleBuiltInCommand],
		onToggleCommand: () => {},
		onEditCommand: () => {},
		onNewCommand: () => {},
	},
};
