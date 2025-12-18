/**
 * External dependencies
 */
import { PanelLeftIcon } from "lucide-react";
import type { ComponentProps } from "react";
/**
 * Internal dependencies
 */
import { useSidebar } from "../sidebarProvider";
import { cn } from "../../../lib";
import { Button } from "../../button";

function SidebarTrigger({
	className,
	onClick,
	...props
}: ComponentProps<typeof Button>) {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			className={cn('size-7', className)}
			onClick={(event) => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
}

export default SidebarTrigger;