/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { MacroList } from './index';
import type { PromptMacro } from '../types';

const meta: Meta<typeof MacroList> = {
    title: 'Components/PromptMacros/MacroList',
    component: MacroList,
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
type Story = StoryObj<typeof MacroList>;

const sampleUserMacro: PromptMacro = {
    name: "user_macro",
    instructions: "User macro instructions...",
    description: "A user defined macro.",
    isBuiltIn: false,
    enabled: true
};

const sampleBuiltInMacro: PromptMacro = {
    name: "built_in_macro",
    instructions: "Built-in instructions...",
    description: "A built-in macro.",
    isBuiltIn: true,
    enabled: true
};

export const Default: Story = {
    args: {
        userMacros: [sampleUserMacro],
        builtInMacros: [sampleBuiltInMacro],
        onToggleMacro: () => { },
        onEditMacro: () => { },
        onNewMacro: () => { }
    },
};

export const EmptyUserMacros: Story = {
    args: {
        userMacros: [],
        builtInMacros: [sampleBuiltInMacro],
        onToggleMacro: () => { },
        onEditMacro: () => { },
        onNewMacro: () => { }
    },
};
