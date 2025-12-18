/**
 * External dependencies
 */
import {
	Sidebar,
	SidebarTrigger,
	useSidebar,
} from '@google-awlt/design-system';
import { Settings } from 'lucide-react';
import { useMemo } from 'react';

const Items = [
	{
		title: 'Settings',
		id: 'settings',
		icon: () => <Settings />,
		component: <div>Settings Page</div>,
	},
];
function Options() {
	const { selectedMenuItem } = useSidebar(({ state }) => ({
		selectedMenuItem: state.selectedMenuItem,
	}));

	const ComponentToRender = useMemo(() => {
		console.log(selectedMenuItem);
		return (
			Items.find((item) => item.id === selectedMenuItem)?.component ?? (
				<></>
			)
		);
	}, [selectedMenuItem]);

	return (
		<>
			<Sidebar items={Items} />
			<main>
				<SidebarTrigger />
			</main>
			{ComponentToRender}
		</>
	);
}

export default Options;
