/**
 * External dependencies
 */
import { PanelLeftIcon } from 'lucide-react';
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { useSidebar } from '../sidebarProvider';
import { Button } from '../../button';

function SidebarTrigger({
  onClick,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar(({ actions }) => ({
    toggleSidebar: actions.toggleSidebar,
  }));

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {children || <PanelLeftIcon />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

export default SidebarTrigger;
