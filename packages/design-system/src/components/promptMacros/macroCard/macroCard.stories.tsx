/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * Internal dependencies.
 */
import { MacroCard } from './index';
import type { PromptMacro } from '../types';

const meta: Meta<typeof MacroCard> = {
    title: 'Components/PromptMacros/MacroCard',
    component: MacroCard,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof MacroCard>;

const sampleMacro: PromptMacro = {
    name: "react-tutor",
    instructions: "You are a react tutor...",
    description: "Helps you learn React.",
    isBuiltIn: false,
    enabled: true
};

export const UserMacro: Story = {
    args: {
        macro: sampleMacro,
        onToggle: () => { },
        onEdit: () => { }
    },
};

export const BuiltInMacro: Story = {
    args: {
        macro: { ...sampleMacro, isBuiltIn: true, name: "fix-bugs", description: "Fix bugs in code." },
        onToggle: () => { },
        onEdit: () => { }
    },
};
