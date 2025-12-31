/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * Internal dependencies.
 */
import { EditCommandDialog } from './index';
import type { PromptCommand } from '../types';
import { Button } from '../../button';

const meta: Meta<typeof EditCommandDialog> = {
    title: 'Components/PromptCommands/EditCommandDialog',
    component: EditCommandDialog,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof EditCommandDialog>;

const sampleCommand: PromptCommand = {
    name: "react-tutor",
    instructions: "You are a react tutor...",
    description: "Helps you learn React.",
    isBuiltIn: false,
    enabled: true
};

const DialogWrapper = (args: any) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="p-4">
            <Button onClick={() => setOpen(true)}>Open Dialog</Button>
            <EditCommandDialog
                {...args}
                open={open}
                onOpenChange={setOpen}
                onSave={(command) => {
                    console.log("Saved", command);
                    setOpen(false);
                }}
            />
        </div>
    );
};

export const CreateNew: Story = {
    render: (args) => <DialogWrapper {...args} />,
    args: {
        onSave: () => { },
        onDelete: undefined,
        existingNames: ['existing-command']
    }
};

export const EditExisting: Story = {
    render: (args) => <DialogWrapper {...args} />,
    args: {
        command: sampleCommand,
        onSave: () => { },
        onDelete: () => { },
        existingNames: ['react-tutor']
    }
};
