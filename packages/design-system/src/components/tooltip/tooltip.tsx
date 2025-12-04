/**
 * External dependencies
 */
import {
	TooltipProvider,
	Root,
	TooltipPortal,
	TooltipContent,
	TooltipTrigger,
	TooltipArrow,
} from '@radix-ui/react-tooltip';
import React, { useMemo, type ReactNode } from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../lib/utils';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
	children: ReactNode;
	body?: ReactNode;
	text?: string;
	placement?: TooltipPlacement;
	disabled?: boolean;
	contentClassName?: string;
}

const TooltipComponent: React.FC<TooltipProps> = ({
	children,
	body,
	text = '',
	placement = 'top',
	disabled = false,
	contentClassName = '',
}) => {
	const tooltipContent = useMemo(() => {
		if (body) {
			return body;
		}

		if (text) {
			return (
				<div className="rounded bg-surface-gray-7 px-2 py-1 text-xs text-ink-white shadow-xl">
					<div>{text}</div>
				</div>
			);
		}

		return null;
	}, [body, text]);

	if (disabled) {
		return <>{children}</>;
	}

	return (
		<TooltipProvider data-slot="tooltip-provider">
			<Root data-slot="tooltip">
				<TooltipTrigger asChild data-slot="tooltip-trigger">
					{children}
				</TooltipTrigger>
				<TooltipPortal>
					{tooltipContent && (
						<TooltipContent
							side={placement}
							data-slot="tooltip-content"
							sideOffset={0}
							className={cn(
								'z-50 w-fit origin-(--radix-tooltip-content-transform-origin) animate-in rounded-md bg-foreground px-3 py-1.5 text-xs text-balance text-background fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
								contentClassName
							)}
						>
							{tooltipContent}
							<TooltipArrow className="z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground" />
						</TooltipContent>
					)}
				</TooltipPortal>
			</Root>
		</TooltipProvider>
	);
};

export default TooltipComponent;
