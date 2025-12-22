/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, Home, Inbox, Search, Settings } from 'lucide-react';
/**
 * Internal dependencies
 */
import { Sidebar, SidebarProvider } from './';

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
			<div className="w-screen">
				<SidebarProvider>
					<Sidebar collapsible="icon" items={args.items} />
				</SidebarProvider>
			</div>
		);
	},
	args: {
		items,
	},
};
