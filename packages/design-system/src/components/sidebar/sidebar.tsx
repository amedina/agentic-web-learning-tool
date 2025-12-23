/**
 * External dependencies
 */
import { type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import {
	SidebarMain,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarTrigger,
} from './components';
import { useSidebar } from './sidebarProvider';

type MenuItem = {
	id: string;
	title: string;
	icon?: () => ReactNode;
};

type SidebarProps = {
	items: MenuItem[];
	side?: "left" | "right";
	sidebarVariant?: "sidebar" | "floating" | "inset";
	collapsible?: "offcanvas" | "icon" | "none";
};

export function Sidebar({ items, sidebarVariant = 'sidebar', collapsible = 'offcanvas', side = 'left' }: SidebarProps) {
	const { setSelectedMenuItem, sidebarState, selectedMenuItem } = useSidebar(({ state, actions }) => ({
		setSelectedMenuItem: actions.setSelectedMenuItem,
		sidebarState: state.sidebarState,
		selectedMenuItem: state.selectedMenuItem,
	}));

	return (
		<SidebarMain variant={sidebarVariant} collapsible={collapsible} side={side}>
			<SidebarHeader className="flex-row justify-between items-center w-full">
				<span className={`text-lg font-bold ${sidebarState === 'expanded' ? '' : 'hidden'}`}>AWLT</span>
				<SidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map(({ id, title, icon }) => (
								<SidebarMenuItem key={title}>
									<SidebarMenuButton asChild isActive={selectedMenuItem === id} className="w-full cursor-pointer">
										<div
											onClick={() => {
												setSelectedMenuItem(id);
											}}
										>
											{icon && icon()}
											<span>{title}</span>
										</div>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</SidebarMain>
	);
}

export default Sidebar;
