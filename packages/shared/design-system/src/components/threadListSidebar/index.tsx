/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { SidebarContent, SidebarMain } from '../sidebar';
import { ThreadList } from '../threadList';

type ThreadListSidebarProps = ComponentProps<typeof SidebarMain> & {
  isThreadLoading: boolean;
};

/**
 * Sidebar shell that hosts the past-conversation thread list. Wraps the list
 * in an off-canvas sidebar tinted with the sidebar surface tokens so it reads
 * as a distinct panel against the chat viewport.
 */
export function ThreadListSidebar({
  isThreadLoading,
  ...props
}: ThreadListSidebarProps) {
  return (
    <SidebarMain collapsible="offcanvas" {...props}>
      <SidebarContent className="aui-sidebar-content bg-sidebar border-r border-sidebar-border px-3 py-3">
        <ThreadList isThreadLoading={isThreadLoading} />
      </SidebarContent>
    </SidebarMain>
  );
}
