/**
 * External dependencies
 */
import type { ComponentProps } from "react";
/**
 * Internal dependencies
 */
import Input from '../../input';
import { cn } from "../../../lib";

function SidebarInput({
    className,
    ...props
}: ComponentProps<typeof Input>) {
    return (
        <Input
            data-slot="sidebar-input"
            data-sidebar="input"
            className={cn('bg-background h-8 w-full shadow-none', className)}
            {...props}
        />
    );
}

export default SidebarInput;
