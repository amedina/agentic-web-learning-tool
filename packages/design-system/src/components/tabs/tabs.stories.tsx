import type { Meta, StoryObj } from '@storybook/addon-docs/blocks';

import { Tabs, TabsList, TabsTrigger, TabsContent } from './index';

/**
 * A set of layered sections that allow navigation between different views.
 */
const meta = {
	title: 'ui/Tabs',
	component: Tabs,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	args: {
		defaultValue: 'account',
	},
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default tabs with two triggers: Account and Password.
 */
export const Default: Story = {
	render: (args) => (
		<Tabs {...args} className="w-[400px]">
			<TabsList>
				<TabsTrigger value="account">Account</TabsTrigger>
				<TabsTrigger value="password">Password</TabsTrigger>
			</TabsList>
			<TabsContent value="account">
				Account content goes here.
			</TabsContent>
			<TabsContent value="password">
				Password content goes here.
			</TabsContent>
		</Tabs>
	),
};

/**
 * Tabs with more triggers for multi-section navigation.
 */
export const Multiple: Story = {
	render: (args) => (
		<Tabs {...args} defaultValue="profile" className="w-[500px]">
			<TabsList>
				<TabsTrigger value="profile">Profile</TabsTrigger>
				<TabsTrigger value="settings">Settings</TabsTrigger>
				<TabsTrigger value="billing">Billing</TabsTrigger>
			</TabsList>
			<TabsContent value="profile">Profile information.</TabsContent>
			<TabsContent value="settings">Settings options.</TabsContent>
			<TabsContent value="billing">Billing details.</TabsContent>
		</Tabs>
	),
};
