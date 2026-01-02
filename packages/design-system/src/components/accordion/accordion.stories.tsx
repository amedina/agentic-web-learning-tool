/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
/**
 * Internal dependencies
 */
import Accordion from './';

const meta = {
	title: 'ui/Accordion',
	component: Accordion,
	tags: ['autodocs'],
	argTypes: {
        triggerText: {
            control: 'text',
        },
		children: {
			control: 'text',
		},
	},
	args: {
        type: 'single',
        collapsible: true,
		triggerText: 'default',
		children: 'Yes. It adheres to the WAI-ARIA design pattern.',
	},
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the button, used for primary actions and commands.
 */
export const Default: Story = {
    args: {
        type: 'single',
        collapsible: true,
        triggerText: 'What is an accordion?',
        children: 'An accordion is a vertically stacked list of items that can be expanded or collapsed to reveal or hide content associated with them. It is commonly used in user interfaces to manage large amounts of content in a limited space, allowing users to focus on specific sections without being overwhelmed by information.'
    }
};
