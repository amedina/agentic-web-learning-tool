/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
import { Content } from '@radix-ui/react-accordion';
/**
 * Internal dependencies
 */
import { cn } from '../../lib';

function AccordionContent({
	className,
	children,
	...props
}: ComponentProps<typeof Content>) {
	return (
		<Content
			data-slot="accordion-content"
			className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm px-4 py-2"
			{...props}
		>
			<div className={cn('pt-0 pb-4', className)}>{children}</div>
		</Content>
	);
}

export default AccordionContent;
