/**
 * External dependencies
 */
import type { ComponentProps } from "react";
/**
 * Internal dependencies
 */
import { cn } from "../../../lib";

function SidebarMenu({ className, ...props }: ComponentProps<'ul'>) {
    return (
        <ul
            data-slot="sidebar-menu"
            data-sidebar="menu"
            className={cn('flex w-full min-w-0 flex-col gap-1', className)}
            {...props}
        />
    );
}

export default SidebarMenu;
