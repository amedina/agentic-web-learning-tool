/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../../lib';

function SidebarMenuSub({ className, ...props }: ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn(
				'border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5',
				'group-data-[collapsible=icon]:hidden',
				className
			)}
			{...props}
		/>
	);
}

export default SidebarMenuSub;
