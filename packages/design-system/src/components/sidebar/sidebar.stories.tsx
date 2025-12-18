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
			<div className="w-screen">
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
