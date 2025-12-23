/**
 * External dependencies
 */
import { Sidebar, useSidebar } from '@google-awlt/design-system';
import { CpuIcon, Settings2 } from 'lucide-react';

/**
 * Internal dependencies
 */
import { AgentStudioTab, SettingsTab } from './components';

const Items = [
	{
		title: 'Agent Studio',
		id: 'agent-studio',
		icon: () => <CpuIcon />,
		component: <AgentStudioTab />,
	},
	{
		title: 'Settings',
		id: 'settings',
		icon: () => <Settings2 />,
		component: <SettingsTab />,
	},
];
function Options() {
	const { selectedMenuItem } = useSidebar(({ state }) => ({
		selectedMenuItem: state.selectedMenuItem,
	}));

	return (
		<>
			<Sidebar items={Items} collapsible="icon" />
			{Items.find((item) => item.id === selectedMenuItem)?.component}
		</>
	);
}

export default Options;
