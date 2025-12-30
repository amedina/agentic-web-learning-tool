/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * Internal dependencies.
 */
import { WebMCPToolsTab } from '.';
import type { WebMCPTool } from '../types';

const meta: Meta<typeof WebMCPToolsTab> = {
    title: 'Components/WebMCPTools/WebMCPToolsTab',
    component: WebMCPToolsTab,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof WebMCPToolsTab>;

const DefaultRender = () => {
    const [userTools, setUserTools] = useState<WebMCPTool[]>([
        {
            name: "example_tool",
            namespace: "user",
            description: "An example user tool",
            allowedDomains: ["example.com"],
            inputSchema: {},
            enabled: true,
            code: "console.log('hello')"
        }
    ]);
    const [builtInTools, setBuiltInTools] = useState<WebMCPTool[]>([
        {
            name: "built_in_tool",
            namespace: "built_in",
            description: "An example built-in tool",
            allowedDomains: ["<all_urls>"],
            inputSchema: {},
            enabled: true,
            isBuiltIn: true
        }
    ]);

    return (
        <div className='min-h-screen min-w-screen'>
            <WebMCPToolsTab
                userTools={userTools}
                builtInTools={builtInTools}
                onSaveUserTools={setUserTools}
                onSaveBuiltInState={setBuiltInTools}
            />
        </div>
    );
};

export const Default: Story = {
    render: () => <DefaultRender />,
};
