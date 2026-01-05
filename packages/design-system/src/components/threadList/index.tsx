/**
 * External dependencies
 */
import {
	ThreadListItemPrimitive,
	ThreadListPrimitive,
} from '@assistant-ui/react';
import { ArchiveIcon, PlusIcon } from 'lucide-react';
/**
 * Internal dependencies
 */
import { TooltipIconButton } from '../tooltipIconButton';
import { Button } from '../button';
import Skeleton from '../skeleton';

type ThreadListProps = {
	isThreadLoading: boolean;
};
export const ThreadList = ({ isThreadLoading }: ThreadListProps) => {
	return (
		<ThreadListPrimitive.Root className="aui-root aui-thread-list-root flex flex-col gap-1">
			<ThreadListNew />
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
				variant="outline"
				className="aui-thread-list-new h-9 justify-start gap-2 rounded-lg px-3 text-sm hover:bg-muted data-active:bg-muted"
			>
				<PlusIcon className="size-4" />
				New Thread
			</Button>
		</ThreadListPrimitive.New>
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
	return (
		<ThreadListItemPrimitive.Root className="aui-thread-list-item group flex h-9 items-center rounded-lg transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none data-active:bg-muted">
			<ThreadListItemPrimitive.Trigger className="aui-thread-list-item-trigger flex h-full flex-1 items-center truncate px-3 text-start text-sm">
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
				tooltip="Archive thread"
				className="aui-thread-list-item-archive mr-2 size-7 p-0 opacity-0 transition-opacity group-hover:opacity-100"
			>
				<ArchiveIcon className="size-4" />
			</TooltipIconButton>
		</ThreadListItemPrimitive.Archive>
	);
};
