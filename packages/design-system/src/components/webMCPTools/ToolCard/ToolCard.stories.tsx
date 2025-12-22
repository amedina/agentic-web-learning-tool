import type { Meta, StoryObj } from '@storybook/react';
import { ToolCard } from '.';
import type { WebMCPTool } from '../types';

const meta: Meta<typeof ToolCard> = {
    title: 'Components/WebMCPTools/ToolCard',
    component: ToolCard,
};

export default meta;
type Story = StoryObj<typeof ToolCard>;

const sampleTool: WebMCPTool = {
    name: "example_tool",
    namespace: "user_scripts",
    version: "1.0.0",
    description: "An example tool description that is long enough to demonstrate wrapping.",
    matchPatterns: ["<all_urls>", "https://example.com/*"],
    inputSchema: {},
    enabled: true,
    isBuiltIn: false
};

export const UserTool: Story = {
    args: {
        tool: sampleTool,
        onToggle: () => { },
        onEdit: () => { }
    },
};

export const BuiltInTool: Story = {
    args: {
        tool: { ...sampleTool, isBuiltIn: true, namespace: "built_in" },
        onToggle: () => { },
    },
};
