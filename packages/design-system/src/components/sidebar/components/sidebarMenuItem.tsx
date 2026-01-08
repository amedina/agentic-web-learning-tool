/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../../lib';

function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn('group/menu-item relative', className)}
			{...props}
		/>
	);
}

export default SidebarMenuItem;
