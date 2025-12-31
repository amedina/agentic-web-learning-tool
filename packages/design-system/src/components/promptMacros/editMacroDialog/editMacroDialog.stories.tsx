/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * Internal dependencies.
 */
import { EditMacroDialog } from './index';
import type { PromptMacro } from '../types';
import { Button } from '../../button';

const meta: Meta<typeof EditMacroDialog> = {
    title: 'Components/PromptMacros/EditMacroDialog',
    component: EditMacroDialog,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof EditMacroDialog>;

const sampleMacro: PromptMacro = {
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
            <EditMacroDialog
                {...args}
                open={open}
                onOpenChange={setOpen}
                onSave={(macro) => {
                    console.log("Saved", macro);
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
        existingNames: ['existing-macro']
    }
};

export const EditExisting: Story = {
    render: (args) => <DialogWrapper {...args} />,
    args: {
        macro: sampleMacro,
        onSave: () => { },
        onDelete: () => { },
        existingNames: ['react-tutor']
    }
};
