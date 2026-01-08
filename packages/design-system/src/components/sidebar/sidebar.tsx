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
import { OwlIcon } from '../../icons';
import { useSidebar } from './sidebarProvider';

type MenuItem = {
	id: string;
	title: string;
	icon?: () => ReactNode;
};

type SidebarProps = {
	items: MenuItem[];
	side?: 'left' | 'right';
	sidebarVariant?: 'sidebar' | 'floating' | 'inset';
	collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function Sidebar({
	items,
	sidebarVariant = 'sidebar',
	collapsible = 'offcanvas',
	side = 'left',
}: SidebarProps) {
	const { setSelectedMenuItem, sidebarState, selectedMenuItem } = useSidebar(
		({ state, actions }) => ({
			setSelectedMenuItem: actions.setSelectedMenuItem,
			sidebarState: state.sidebarState,
			selectedMenuItem: state.selectedMenuItem,
		})
	);

	return (
		<SidebarMain
			variant={sidebarVariant}
			collapsible={collapsible}
			side={side}
		>
			<SidebarHeader className="flex justify-between items-center w-full">
				<div className="flex items-center gap-2">
					<div
						className={`ml-2 ${sidebarState === 'expanded' ? '' : 'hidden'}`}
					>
						<OwlIcon className={`h-6 w-6`} />
					</div>
					<span
						className={`text-lg font-bold ${sidebarState === 'expanded' ? '' : 'hidden'}`}
					>
						AWLT
					</span>
				</div>
				<SidebarTrigger />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map(({ id, title, icon }) => (
								<SidebarMenuItem key={title}>
									<SidebarMenuButton
										asChild
										isActive={selectedMenuItem === id}
										className="w-full cursor-pointer"
									>
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
