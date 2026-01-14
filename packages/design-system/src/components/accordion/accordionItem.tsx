/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
import { Item } from '@radix-ui/react-accordion';
/**
 * Internal dependencies
 */
import { cn } from '../../lib';

function AccordionItem({ className, ...props }: ComponentProps<typeof Item>) {
  return (
    <Item
      data-slot="accordion-item"
      className={cn('border-b', className)}
      {...props}
    />
  );
}

export default AccordionItem;
