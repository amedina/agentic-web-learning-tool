/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../lib';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
	return (
		<div
			data-slot="skeleton"
			className={cn('bg-accent animate-pulse rounded-md', className)}
			{...props}
		/>
	);
}
export default Skeleton;
