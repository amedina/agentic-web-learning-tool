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
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<typeof ToolList>;

const sampleUserTool: WebMCPTool = {
    name: "user_script",
    namespace: "user_scripts",
    version: "1.0.0",
    description: "A user defined script.",
    matchPatterns: ["<all_urls>"],
    inputSchema: {},
    enabled: true,
    isBuiltIn: false
};

const sampleBuiltInTool: WebMCPTool = {
    name: "built_in_tool",
    namespace: "built_in",
    version: "1.0.0",
    description: "A built-in tool.",
    matchPatterns: ["<all_urls>"],
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
