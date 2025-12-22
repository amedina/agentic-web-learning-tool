/**
 * External dependencies.
 */
import type { Meta, StoryObj } from '@storybook/react';

/**
 * Internal dependencies.
 */
import { WebMCPToolsTab } from '.';

const meta: Meta<typeof WebMCPToolsTab> = {
    title: 'Components/WebMCPTools/WebMCPToolsTab',
    component: WebMCPToolsTab,
    parameters: {
        layout: 'fullscreen',
    },
};

export default meta;
type Story = StoryObj<typeof WebMCPToolsTab>;

export const Default: Story = {
    render: () => <WebMCPToolsTab />,
};
