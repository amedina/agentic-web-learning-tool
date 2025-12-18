/**
 * External dependencies
 */
import type { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import {
	SidebarMain,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from './components';
import { useSidebar } from './sidebarProvider';

type MenuItem = {
	id: string;
	title: string;
	icon?: () => ReactNode;
};

type SidebarProps = {
	items: MenuItem[];
};

export function Sidebar({ items }: SidebarProps) {
	const { setSelectedMenuItem } = useSidebar(({ actions }) => ({
		setSelectedMenuItem: actions.setSelectedMenuItem,
	}));

	return (
		<SidebarMain>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>AWLT</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map(({ id, title, icon }) => (
								<SidebarMenuItem
									key={title}
									onClick={() => {
										setSelectedMenuItem(id);
									}}
								>
									<SidebarMenuButton asChild isActive>
										<div
											onClick={() => {
												console.log(id);
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
