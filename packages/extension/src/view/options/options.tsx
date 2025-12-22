/**
 * External dependencies
 */
import {
	Sidebar,
	useSidebar,
} from '@google-awlt/design-system';
import { CpuIcon, CodeIcon } from 'lucide-react';

/**
 * Internal dependencies
 */
import { AgentStudioTab, WebMCPToolsTab } from './components';

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
];
function Options() {
	const { selectedMenuItem } = useSidebar(({ state }) => ({
		selectedMenuItem: state.selectedMenuItem,
	}));

	return (
		<>
			<Sidebar items={Items} collapsible='icon' />
			{Items.find((item) => item.id === selectedMenuItem)?.component}
		</>
	);
}

export default Options;
