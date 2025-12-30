/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * Internal dependencies.
 */
import { EditToolDialog } from '.';
import type { WebMCPTool } from '../types';
import { Button } from '../../../index';

const meta: Meta<typeof EditToolDialog> = {
    title: 'Components/WebMCPTools/EditToolDialog',
    component: EditToolDialog,
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof EditToolDialog>;

const sampleTool: WebMCPTool = {
    name: "example_tool",
    namespace: "user_scripts",
    description: "An example tool.",
    allowedDomains: ["<all_urls>"],
    inputSchema: {},
    code: `export const metadata = {\n  name: "example_tool",\n  namespace: "user_scripts",\n  description: "An example tool.",\n  allowedDomains: ["<all_urls>"],\n  inputSchema: {}\n};\n\nexport async function execute(args) {\n  return "Hello";\n}`,
    enabled: true,
    isBuiltIn: false
};

const DialogWrapper = (args: any) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="p-4">
            <Button onClick={() => setOpen(true)}>Open Dialog</Button>
            <EditToolDialog
                {...args}
                open={open}
                onOpenChange={setOpen}
                onSave={(tool) => {
                    console.log("Saved", tool);
                    setOpen(false);
                }}
            />
        </div>
    );
};

export const Default: Story = {
    render: (args) => <DialogWrapper {...args} />,
    args: {
        onSave: () => { },
        onDelete: () => { },
    }
};

export const EditExisting: Story = {
    render: (args) => <DialogWrapper {...args} />,
    args: {
        tool: sampleTool,
        onSave: () => { },
        onDelete: () => { },
    }
};
