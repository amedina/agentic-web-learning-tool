import type { Meta, StoryObj } from '@storybook/react';
import { EditToolDialog } from '.';
import type { WebMCPTool } from '../types';
import { useState } from 'react';
import { Button } from '../../../index';

const meta: Meta<typeof EditToolDialog> = {
    title: 'Components/WebMCPTools/EditToolDialog',
    component: EditToolDialog,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof EditToolDialog>;

const sampleTool: WebMCPTool = {
    name: "example_tool",
    namespace: "user_scripts",
    version: "1.0.0",
    description: "An example tool.",
    matchPatterns: ["<all_urls>"],
    inputSchema: {},
    code: `export const metadata = {\n  name: "example_tool",\n  namespace: "user_scripts",\n  version: "1.0.0",\n  description: "An example tool.",\n  match: ["<all_urls>"],\n  inputSchema: {}\n};\n\nexport async function execute(args) {\n  return "Hello";\n}`,
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
