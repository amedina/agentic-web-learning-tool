/**
 * External dependencies
 */
import { Button, Tooltip, cn } from "@google-awlt/design-system";
import type { ComponentPropsWithoutRef, FC } from "react";

type ActionButtonProps = ComponentPropsWithoutRef<typeof Button> & {
	tooltip: string;
};

const ActionButton: FC<ActionButtonProps> = ({
	tooltip,
	className,
	children,
	...rest
}) => {
	return (
		<Tooltip text={tooltip}>
			<Button
				variant="ghost"
				size="icon"
				className={cn('size-auto p-1 text-[#b4b4b4]', className)}
				{...rest}
			>
				{children}
				<span className="sr-only">{tooltip}</span>
			</Button>
		</Tooltip>
	);
};

export default ActionButton;