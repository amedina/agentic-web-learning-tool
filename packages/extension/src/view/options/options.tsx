/**
 * External dependencies
 */
import {
	Sidebar,
	SidebarTrigger,
	useSidebar,
} from '@google-awlt/design-system';
import { CpuIcon } from 'lucide-react';
/**
 * Internal dependencies
 */
import { AgentStudioTab } from './components';

const Items = [
	{
		title: 'Agent Studio',
		id: 'agent-studio',
		icon: () => <CpuIcon />,
		component: <AgentStudioTab />,
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
