import {
	SIDEBAR_ITEMS_KEYS,
	type CollapsedSidebarItems,
	type SidebarItems,
} from '@google-awlt/design-system';
import { Learning } from './learning';
import Settings from './settings';
import { BookOpen, Inspect, SettingsIcon } from 'lucide-react';
import Inspector from './inspector';

const TABS: SidebarItems = {
	[SIDEBAR_ITEMS_KEYS.PRIVACY_SANDBOX]: {
		title: () => 'MCP Inspector',
		panel: {
			Element: Inspector,
		},
		icon: {
			Element: Inspect as any,
		},
		selectedIcon: {
			Element: Inspect as any,
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
			Element: BookOpen as any,
			props: {
				className: 'fill-granite-gray',
			},
		},
		selectedIcon: {
			Element: BookOpen as any,
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
			Element: SettingsIcon as any,
			props: {
				className: 'fill-granite-gray w-4 h-4',
			},
		},
		selectedIcon: {
			Element: SettingsIcon as any,
			props: {
				className: 'fill-bright-gray w-4 h-4',
			},
		},
		dropdownOpen: false,
		addSpacer: false,
		children: {},
		containerClassName: 'h-6',
	},
	[SIDEBAR_ITEMS_KEYS.OPEN_SIDEPANEL_LLM]: {
		title: () => 'Sidepanel LLM',
		panel: {
			skipPanelDisplay: true,
			cta: async () => {
				const tab = await chrome.tabs.get(
					chrome.devtools.inspectedWindow.tabId
				);
				if (tab === undefined) {
					return;
				}
				chrome.sidePanel.open({
					windowId: tab.windowId,
				});
			},
		},
		icon: {
			Element: SettingsIcon as any,
			props: {
				className: 'fill-granite-gray w-4 h-4',
			},
		},
		selectedIcon: {
			Element: SettingsIcon as any,
			props: {
				className: 'fill-bright-gray w-4 h-4',
			},
		},
		dropdownOpen: false,
		addSpacer: true,
		children: {},
		containerClassName: 'h-6',
	},
};

export default TABS;

export const collapsedSidebarData: CollapsedSidebarItems = {
	footerElements: {},
};
