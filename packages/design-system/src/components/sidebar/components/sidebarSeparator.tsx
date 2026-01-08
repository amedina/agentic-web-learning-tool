/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../../lib';
import Separator from '../../separator';

function SidebarSeparator({
	className,
	...props
}: ComponentProps<typeof Separator>) {
	return (
		<Separator
			data-slot="sidebar-separator"
			data-sidebar="separator"
			className={cn('bg-sidebar-border mx-2 w-auto', className)}
			{...props}
		/>
	);
}

export default SidebarSeparator;
