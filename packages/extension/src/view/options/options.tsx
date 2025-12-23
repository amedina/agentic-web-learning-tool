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
import { useEffect } from 'react';

const Items = [
	{
		title: 'Agent Studio',
		id: 'agent-studio',
		icon: () => <CpuIcon />,
		component: <AgentStudioTab />,
	},
];
function Options() {
	const { selectedMenuItem, setSelectedMenuItem } = useSidebar(({ state, actions }) => ({
		selectedMenuItem: state.selectedMenuItem,
		setSelectedMenuItem: actions.setSelectedMenuItem,
	}));

	useEffect(() => {
		setSelectedMenuItem(Items[0].id);
	}, []);	

	return (
		<>
			<div className="fixed top-0 left-0 z-20 md:hidden pl-4 shadow bg-sidebar rounded-md">
				<SidebarTrigger />
			</div>
			<Sidebar items={Items} collapsible='icon' />
			{Items.find((item) => item.id === selectedMenuItem)?.component}
		</>
	);
}

export default Options;
