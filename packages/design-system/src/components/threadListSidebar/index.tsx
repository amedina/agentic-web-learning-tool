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

export function ThreadListSidebar({
  isThreadLoading,
  ...props
}: ThreadListSidebarProps) {
  return (
    <SidebarMain collapsible="offcanvas" {...props}>
      <SidebarContent className="aui-sidebar-content px-2 py-2">
        <ThreadList isThreadLoading={isThreadLoading} />
      </SidebarContent>
    </SidebarMain>
  );
}
