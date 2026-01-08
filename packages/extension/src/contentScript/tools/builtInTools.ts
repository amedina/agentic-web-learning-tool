import {
	BookmarksApiTools,
	DomExtractionTools,
	HistoryApiTools,
	ScriptingApiTools,
	StorageApiTools,
	TabGroupsApiTools,
	TabsApiTools,
	WindowsApiTools,
} from '@mcp-b/extension-tools';

export const builtInTools = {
	bookmarks: {
		name: 'Bookmarks',
		instance: BookmarksApiTools,
		enabled: true,
	},
	domExtraction: {
		name: 'Dom Extraction',
		instance: DomExtractionTools,
		enabled: true,
	},
	history: {
		name: 'History',
		instance: HistoryApiTools,
		enabled: true,
	},
	scripting: {
		name: 'Scripting',
		instance: ScriptingApiTools,
		options: {
			executeScript: true,
			executeUserScript: true,
			insertCSS: false,
			removeCSS: false,
		},
		enabled: true,
	},
	storage: {
		name: 'Storage',
		instance: StorageApiTools,
		enabled: true,
	},
	tabGroups: {
		name: 'Tab Groups',
		instance: TabGroupsApiTools,
		enabled: true,
	},
	tabs: {
		name: 'Tabs',
		instance: TabsApiTools,
		options: {
			getAllTabs: true,
			createTab: true,
			closeTabs: true,
			updateTab: true,
		},
		enabled: true,
	},
	windows: {
		name: 'Windows',
		instance: WindowsApiTools,
		enabled: true,
	},
};
