/**
 * External dependencies
 */
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from '@assistant-ui/react';
import {
  MessageSquareText,
  PanelLeftClose,
  PlusIcon,
  Trash2,
} from 'lucide-react';
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

/**
 * Sidebar panel listing past chat threads with a "New Chat" action and a
 * collapse control. The layout keeps the header tight against the panel edge
 * and gives the list a single consistent gap so threads read as a stack
 * instead of a series of disconnected rows.
 */
export const ThreadList = ({ isThreadLoading }: ThreadListProps) => {
  return (
    <ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col h-full">
      <ThreadListHeader />
      <ThreadListNew />
      <div className="mt-3 mb-2 border-t border-sidebar-border" />
      <div className="flex flex-col gap-0.5 overflow-y-auto pr-0.5 -mr-0.5">
        {isThreadLoading ? (
          <ThreadListSkeleton />
        ) : (
          <ThreadListPrimitive.Items components={{ ThreadListItem }} />
        )}
      </div>
    </ThreadListPrimitive.Root>
  );
};

/** Compact header row with the panel label and the collapse trigger. */
const ThreadListHeader = () => {
  return (
    <div className="flex items-center justify-between mb-2 px-1">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Chat History
      </span>
      <SidebarTrigger className="size-7 text-muted-foreground hover:text-foreground">
        <PanelLeftClose className="size-4" />
      </SidebarTrigger>
    </div>
  );
};

/** Full-width "New Chat" button that triggers a fresh thread. */
const ThreadListNew = () => {
  return (
    <ThreadListPrimitive.New asChild>
      <Button
        variant="outline"
        className="aui-thread-list-new w-full h-9 justify-start gap-2 rounded-lg px-3 text-sm font-medium border-sidebar-border hover:border-fiery-orange/40 hover:bg-fiery-orange/10 hover:text-fiery-orange data-active:bg-fiery-orange/10 data-active:text-fiery-orange transition-colors"
      >
        <PlusIcon className="size-4" />
        New Chat
      </Button>
    </ThreadListPrimitive.New>
  );
};

/** Loading placeholder shown while the thread list is hydrating. */
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

/** A single past-thread row: chat icon, truncated title, and delete affordance on hover. */
const ThreadListItem = () => {
  const { setOpen } = useSidebar(({ actions }) => ({
    setOpen: actions.setOpen,
  }));
  return (
    <ThreadListItemPrimitive.Root className="aui-thread-list-item group relative flex h-9 items-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:bg-sidebar-accent focus-visible:outline-none data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:before:absolute data-active:before:inset-y-1.5 data-active:before:left-0 data-active:before:w-0.5 data-active:before:rounded-full data-active:before:bg-fiery-orange">
      <ThreadListItemPrimitive.Trigger
        onClick={() => setOpen(false)}
        className="aui-thread-list-item-trigger flex h-full flex-1 items-center gap-2 truncate px-3 text-start text-sm"
      >
        <MessageSquareText className="size-3.5 shrink-0 text-muted-foreground group-data-active:text-sidebar-accent-foreground" />
        <span className="truncate">
          <ThreadListItemPrimitive.Title fallback="New Chat" />
        </span>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemArchive />
    </ThreadListItemPrimitive.Root>
  );
};

/** Delete-thread icon that fades in when the row is hovered or focused. */
const ThreadListItemArchive = () => {
  return (
    <ThreadListItemPrimitive.Archive asChild>
      <TooltipIconButton
        variant="ghost"
        tooltip="Delete thread"
        className="aui-thread-list-item-archive mr-1 size-7 p-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </TooltipIconButton>
    </ThreadListItemPrimitive.Archive>
  );
};
