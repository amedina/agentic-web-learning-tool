/**
 * External dependencies
 */
import type { ComponentProps } from 'react';
/**
 * External dependencies
 */
import { SidebarContent, SidebarMain, SidebarRail } from '../sidebar';
import { ThreadList } from '../threadList';

type ThreadListSidebarProps = ComponentProps<typeof SidebarMain> & {
  isThreadLoading: boolean;
};

export function ThreadListSidebar({
  isThreadLoading,
  ...props
}: ThreadListSidebarProps) {
  return (
    <SidebarMain collapsible="icon" {...props}>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList isThreadLoading={isThreadLoading} />
      </SidebarContent>
      <SidebarRail />
    </SidebarMain>
  );
}
