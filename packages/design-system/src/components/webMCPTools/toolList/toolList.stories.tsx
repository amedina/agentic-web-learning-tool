/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies.
 */
import { ToolList } from '.';
import type { WebMCPTool } from '../types';

const meta: Meta<typeof ToolList> = {
    title: 'Components/WebMCPTools/ToolList',
    component: ToolList,
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
type Story = StoryObj<typeof ToolList>;

const sampleUserTool: WebMCPTool = {
    name: "user_script",
    namespace: "user_scripts",
    description: "A user defined script.",
    allowedDomains: ["<all_urls>"],
    inputSchema: {},
    enabled: true,
    isBuiltIn: false
};

const sampleBuiltInTool: WebMCPTool = {
    name: "built_in_tool",
    namespace: "built_in",
    description: "A built-in tool.",
    allowedDomains: ["<all_urls>"],
    inputSchema: {},
    enabled: true,
    isBuiltIn: true
};

export const Default: Story = {
    args: {
        userTools: [sampleUserTool],
        builtInTools: [sampleBuiltInTool],
        onToggleTool: () => { },
        onEditTool: () => { }
    },
};

export const EmptyUserTools: Story = {
    args: {
        userTools: [],
        builtInTools: [sampleBuiltInTool],
        onToggleTool: () => { },
        onEditTool: () => { }
    },
};
