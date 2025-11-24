import {
	SIDEBAR_ITEMS_KEYS,
	type CollapsedSidebarItems,
	type SidebarItems,
} from '@google-awlt/design-system';
import { Learning } from './learning';
import Settings from './settings';
import { BookOpen, Inspect, SettingsIcon } from 'lucide-react';

const TABS: SidebarItems = {
	[SIDEBAR_ITEMS_KEYS.PRIVACY_SANDBOX]: {
		title: () => 'Privacy Sandbox',
		panel: {
			Element: null,
		},
		icon: {
			Element: Inspect,
		},
		selectedIcon: {
			Element: Inspect,
			props: {
				className: 'fill-bright-gray',
			},
		},
		dropdownOpen: true,
		addDivider: true,
		children: {},
	},
	[SIDEBAR_ITEMS_KEYS.LEARNING]: {
		title: () => 'Learning',
		panel: {
			Element: Learning,
		},
		icon: {
			Element: BookOpen,
			props: {
				className: 'fill-granite-gray',
			},
		},
		selectedIcon: {
			Element: BookOpen,
			props: {
				className: 'fill-bright-gray',
			},
		},
		dropdownOpen: true,
		children: {},
		containerClassName: 'h-6',
		addDivider: true,
	},
	[SIDEBAR_ITEMS_KEYS.SETTINGS]: {
		title: () => 'Settings',
		panel: {
			Element: Settings,
		},
		icon: {
			Element: SettingsIcon,
			props: {
				className: 'fill-granite-gray w-4 h-4',
			},
		},
		selectedIcon: {
			Element: SettingsIcon,
			props: {
				className: 'fill-bright-gray w-4 h-4',
			},
		},
		dropdownOpen: false,
		addSpacer: false,
		children: {},
		containerClassName: 'h-6',
		addDivider: true,
	},
};

export default TABS;

export const collapsedSidebarData: CollapsedSidebarItems = {
	footerElements: {},
};
