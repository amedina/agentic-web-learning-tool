/**
 * External Dependencies.
 */
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Internal Dependencies.
 */
import { cn } from '../../lib/utils';

/**
 * Variants for Tab Triggers.
 *
 * Base styles: Applied to all tab triggers (flexbox, spacing, font size, transitions, etc.).
 * Variants:
 * default – Standard look, with hover, focus, and active styles.
 * ghost – A lighter, more subtle version (underline when active, transparent background).
 * defaultVariants: If no variant is passed, it defaults to default.
 */
const tabsTriggerVariants = cva(
	'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
	{
		variants: {
			variant: {
				default:
					'text-muted-foreground hover:text-foreground cursor-pointer ' +
					'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 ' +
					'focus-visible:ring-ring focus-visible:ring-offset-2 ' +
					'data-[state=active]:bg-background data-[state=active]:text-foreground ' +
					'data-[state=active]:shadow-sm',
				ghost:
					'text-muted-foreground hover:text-foreground cursor-pointer ' +
					'hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 ' +
					'focus-visible:ring-ring focus-visible:ring-offset-2 ' +
					'data-[state=active]:text-foreground data-[state=active]:underline',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

/**
 * Tabs.
 *
 * Container for the tabs.
 */
const Tabs = TabsPrimitive.Root;

/**
 * Tabs List.
 *
 * Wraps Radix’s TabsPrimitive.List.
 * Radix's Primitives are low-level, accessible, and unstyled building blocks.
 * Adds styling: flex row, rounded background, muted text.
 * Uses forwardRef, so you can still pass refs if needed.
 * The ref won’t pass down automatically unless the component is wrapped in forwardRef.
 * So forwardRef allows us to forward the ref to the underlying Radix TabsPrimitive.List.
 */
const TabsList = React.forwardRef<
	React.ComponentRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
			className
		)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

/**
 * Tabs Trigger.
 *
 * Wraps Radix’s TabsPrimitive.Trigger.
 * Applies the variant styles from tabsTriggerVariants.
 * variant prop decides if it’s default or ghost.
 */
const TabsTrigger = React.forwardRef<
	React.ComponentRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> &
		VariantProps<typeof tabsTriggerVariants>
>(({ className, variant, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(tabsTriggerVariants({ variant }), className)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/**
 * Tabs Content.
 *
 * Wraps Radix’s TabsPrimitive.Content.
 * Adds padding, border, and background.
 * This is where the actual tab panel content goes.
 */
const TabsContent = React.forwardRef<
	React.ComponentRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			'mt-2 rounded-md border border-input bg-background p-4',
			className
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
