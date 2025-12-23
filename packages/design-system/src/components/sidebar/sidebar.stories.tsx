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
		id: 'home',
		icon: () => <Home />,
	},
	{
		title: 'Inbox',
		id: 'inbox',
		icon: () => <Inbox />,
	},
	{
		title: 'Calendar',
		id: 'calendar',
		icon: () => <Calendar />,
	},
	{
		title: 'Search',
		id: 'search',
		icon: () => <Search />,
	},
	{
		title: 'Settings',
		id: 'settings',
		icon: () => <Settings />,
	},
];

const meta = {
	title: 'ui/Sidebar',
	component: Sidebar,
	tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		return (
			<div className="w-screen h-screen">
				<SidebarProvider>
					<div className="fixed top-0 left-0 z-20 md:hidden pl-4 shadow bg-sidebar rounded-md">
						<SidebarTrigger />
					</div>
					<Sidebar collapsible="icon" items={args.items} />
				</SidebarProvider>
			</div>
		);
	},
	args: {
		items,
	},
};
