/**
 * External dependencies
 */
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from '@assistant-ui/react';
import { ArchiveIcon, PlusIcon, Sidebar, MessageSquare } from 'lucide-react';
/**
 * Internal dependencies
 */
import { TooltipIconButton } from '../tooltipIconButton';
import { Button } from '../button';
import Skeleton from '../skeleton';
import { SidebarTrigger, useSidebar } from '../sidebar';

type ThreadListProps = {
  isThreadLoading: boolean;
};

export const ThreadList = ({ isThreadLoading }: ThreadListProps) => {
  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col gap-1">
      <div className="w-full flex flex-row items-center gap-2">
        <ThreadListNew />
        <ThreadListClose />
      </div>
      {isThreadLoading ? (
        <ThreadListSkeleton />
      ) : (
        <ThreadListPrimitive.Items components={{ ThreadListItem }} />
      )}
    </ThreadListPrimitive.Root>
  );
};

const ThreadListNew = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="default"
        className="aui-thread-list-new flex-1 h-9 justify-start gap-2 rounded-lg px-3 text-sm font-medium shadow-sm"
      >
        <PlusIcon className="size-4" />
        New Chat
      </Button>
    </ThreadListPrimitive.New>
  );
};

const ThreadListClose = () => {
  return (
    <SidebarTrigger className="aui-thread-list-new h-9 w-9 flex items-center justify-center rounded-lg text-sm hover:bg-muted data-active:bg-muted ml-0.5 shrink-0 transition-colors">
      <Sidebar className="size-4 text-muted-foreground" />
    </SidebarTrigger>
  );
};

const ThreadListSkeleton = () => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading threads"
          className="aui-thread-list-skeleton-wrapper flex h-9 items-center px-3"
        >
          <Skeleton className="aui-thread-list-skeleton h-4 w-full" />
        </div>
      ))}
    </div>
  );
};

const ThreadListItem = () => {
  const { setOpen } = useSidebar(({ actions }) => ({
    setOpen: actions.setOpen,
  }));
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-9 items-center rounded-lg transition-colors hover:bg-accent/40 focus-visible:bg-accent focus-visible:outline-none data-active:bg-accent data-[active]:bg-accent/70 mt-1 cursor-pointer">
      <ThreadListItemPrimitive.Trigger
        onClick={() => setOpen(false)}
        className="aui-thread-list-item-trigger flex h-full flex-1 items-center gap-2.5 truncate px-3 text-start text-sm font-medium text-muted-foreground group-data-[active]:text-foreground transition-colors"
      >
        <MessageSquare className="size-3.5 shrink-0" />
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

const ThreadListItemArchive = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        variant="ghost"
        tooltip="Delete thread"
        className="aui-thread-list-item-archive mr-2 size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <ArchiveIcon className="size-4" />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
