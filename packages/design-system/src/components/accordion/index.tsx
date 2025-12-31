/**
 * External dependencies
 */
import type { ComponentProps, PropsWithChildren } from 'react';
import { Root } from '@radix-ui/react-accordion';
/**
 * Internal dependencies
 */
import AccordionContent from './accordionContent';
import AccordionItem from './accordionItem';
import AccordionTrigger from './accordionTrigger';

type AccordionProps = PropsWithChildren<ComponentProps<typeof Root>> & {
	triggerText: string;
};

function Accordion({ triggerText, children, ...props }: AccordionProps) {
	return (
		<Root data-slot="accordion" className="w-full" {...props}>
			<AccordionItem value="item-1">
				<AccordionTrigger>{triggerText}</AccordionTrigger>
				<AccordionContent>
					{children}
				</AccordionContent>
			</AccordionItem>
		</Root>
	);
}

export default Accordion;
