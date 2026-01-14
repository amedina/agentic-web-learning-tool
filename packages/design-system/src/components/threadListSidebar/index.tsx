import * as React from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '../sidebar';
import { ThreadList } from '../threadList';
type ThreadListSidebarProps = React.ComponentProps<typeof Sidebar> & {
  isThreadLoading: boolean;
};

export function ThreadListSidebar({
  isThreadLoading,
  ...props
}: ThreadListSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent className="aui-sidebar-content px-2">
        <ThreadList isThreadLoading={isThreadLoading} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
