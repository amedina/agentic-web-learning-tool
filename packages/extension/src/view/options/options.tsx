/**
 * External dependencies
 */
import {
	Sidebar,
	SidebarTrigger,
	useSidebar,
} from '@google-awlt/design-system';
import { CpuIcon, CodeIcon, Settings2 } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Internal dependencies
 */
import { AgentStudioTab, WebMCPToolsTab, SettingsTab } from './components';

const Items = [
	{
		title: 'Agent Studio',
		id: 'agent-studio',
		icon: () => <CpuIcon />,
		component: <AgentStudioTab />,
	},
	{
		title: 'WebMCP Tools',
		id: 'webmcp-tools',
		icon: () => <CodeIcon />,
		component: <WebMCPToolsTab />,
	},
	{
		title: 'Settings',
		id: 'settings',
		icon: () => <Settings2 />,
		component: <SettingsTab />,
	},
];

function Options() {
	const { selectedMenuItem, setSelectedMenuItem } = useSidebar(
		({ state, actions }) => ({
			selectedMenuItem: state.selectedMenuItem,
			setSelectedMenuItem: actions.setSelectedMenuItem,
		})
	);

	useEffect(() => {
		if (!selectedMenuItem) {
			setSelectedMenuItem(Items[0].id);
		}
	}, [selectedMenuItem]);

	return (
		<>
			<div className="fixed top-0 left-0 z-20 md:hidden pl-4 shadow bg-sidebar rounded-md">
				<SidebarTrigger />
			</div>
			<Sidebar items={Items} collapsible="icon" />
			{Items.find((item) => item.id === selectedMenuItem)?.component}
		</>
	);
}

export default Options;
