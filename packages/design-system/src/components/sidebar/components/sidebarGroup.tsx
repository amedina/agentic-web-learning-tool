/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../../lib';

function SidebarGroup({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn(
				'relative flex w-full min-w-0 flex-col p-2',
				className
			)}
			{...props}
		/>
	);
}

export default SidebarGroup;
