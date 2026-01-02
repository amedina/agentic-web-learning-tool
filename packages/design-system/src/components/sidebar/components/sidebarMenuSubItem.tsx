/**
 * External dependencies
 */
import type { ComponentProps } from "react";
/**
 * Internal dependencies
 */
import { cn } from "../../../lib";

function SidebarMenuSubItem({
	className,
	...props
}: ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-sub-item"
			data-sidebar="menu-sub-item"
			className={cn('group/menu-sub-item relative', className)}
			{...props}
		/>
	);
}


export default SidebarMenuSubItem;
