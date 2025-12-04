/**
 * External dependencies
 */
import { type ComponentPropsWithRef, forwardRef } from 'react';
import { Slottable } from '@radix-ui/react-slot';
/**
 * Internal dependencies
 */
import { Tooltip } from '../tooltip';
import { Button } from '../button';
import { cn } from '../../lib/utils';

export type TooltipIconButtonProps = ComponentPropsWithRef<typeof Button> & {
	tooltip: string;
	side?: 'top' | 'bottom' | 'left' | 'right';
};

const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
	({ children, tooltip, side = 'bottom', className, ...rest }, ref) => {
		return (
			<Tooltip text={tooltip} placement={side}>
				<Button
					variant="ghost"
					size="icon"
					{...rest}
					className={cn('aui-button-icon size-6 p-1', className)}
					ref={ref}
				>
					<Slottable>{children}</Slottable>
					<span className="aui-sr-only sr-only">{tooltip}</span>
				</Button>
			</Tooltip>
		);
	}
);

TooltipIconButton.displayName = 'TooltipIconButton';

export default TooltipIconButton;
