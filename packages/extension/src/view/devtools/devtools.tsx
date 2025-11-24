import React, { useRef, useEffect, useState } from 'react';
import {
	SIDEBAR_ITEMS_KEYS,
	SidebarProvider,
} from '@google-awlt/design-system';
/**
 * Internal dependencies.
 */
import TABS, { collapsedSidebarData } from './tabs';
import Layout from './layout';

const setThemeMode = (isDarkMode: boolean) => {
	if (isDarkMode) {
		document.body.classList.add('dark');
		document.body.classList.remove('light');
	} else {
		document.body.classList.add('light');
		document.body.classList.remove('dark');
	}
};

// set initial theme mode based on devtools theme
const theme = chrome.devtools.panels.themeName;
setThemeMode(theme === 'dark');

const Devtools: React.FC = () => {
	const contextInvalidatedRef = useRef(null);


	const [defaultSelectedItemKey] = useState(
		SIDEBAR_ITEMS_KEYS.SETTINGS
	);


	// update theme mode when the browser theme changes
	useEffect(() => {
		const onColorSchemeChange = (e: MediaQueryListEvent) => {
			setThemeMode(e.matches);
		};

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		if (mediaQuery) {
			mediaQuery.addEventListener('change', onColorSchemeChange);
		}

		return () => {
			if (mediaQuery) {
				mediaQuery.removeEventListener('change', onColorSchemeChange);
			}
		};
	}, []);

	return (
		<SidebarProvider
			data={TABS}
			defaultSelectedItemKey={defaultSelectedItemKey}
			collapsedData={collapsedSidebarData}
			collapsedState={false}
		>
			<div
				className="w-full h-screen overflow-hidden dark:bg-raisin-black"
				ref={contextInvalidatedRef}
			>
				<Layout />
			</div>
		</SidebarProvider>
	);
};

export default Devtools;
