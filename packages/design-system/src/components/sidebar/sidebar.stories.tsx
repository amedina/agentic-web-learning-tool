/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Sidebar, SidebarProvider, SidebarTrigger } from './';

// Menu items.
const items = [
	{
		title: 'Home',
		url: '#',
		icon: () => <Home />,
	},
	{
		title: 'Inbox',
		url: '#',
		icon: () => <Inbox />,
	},
	{
		title: 'Calendar',
		url: '#',
		icon: () => <Calendar />,
	},
	{
		title: 'Search',
		url: '#',
		icon: () => <Search />,
	},
	{
		title: 'Settings',
		url: '#',
		icon: () => <Settings />,
	},
];

/**
 * Displays a button or a component that looks like a button.
 */
const meta = {
	title: 'ui/Sidebar',
	component: Sidebar,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		return (
            <div className='w-screen'>
			<SidebarProvider>
				<Sidebar items={args.items} />
				<main>
					<SidebarTrigger />
				</main>
			</SidebarProvider>
            </div>
		);
	},
	args: {
		items,
	},
};
