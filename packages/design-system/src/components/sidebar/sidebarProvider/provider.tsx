/**
 * External dependencies
 */
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentProps,
	type CSSProperties,
} from 'react';
/**
 * Internal dependencies
 */
import { cn } from '../../../lib';
import { Tooltip } from '../../tooltip';
import SidebarContext, { type SidebarContextProps } from './context';
import {
	SIDEBAR_COOKIE_NAME,
	SIDEBAR_COOKIE_MAX_AGE,
	SIDEBAR_KEYBOARD_SHORTCUT,
	SIDEBAR_WIDTH,
	SIDEBAR_WIDTH_ICON,
} from '../constants';
import useIsMobile from '../hooks/useIsMobile';

function SidebarProvider({
	defaultOpen = true,
	open: openProp,
	onOpenChange: setOpenProp,
	className,
	style,
	children,
	...props
}: ComponentProps<'div'> & {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	// This is the internal state of the sidebar.
	// We use openProp and setOpenProp for control from outside the component.
	const [_open, _setOpen] = useState(defaultOpen);
	const isMobile = useIsMobile();
	const open = openProp ?? _open;
	const [selectedMenuItem, setSelectedMenuItem] = useState(
		localStorage.getItem('sidebarSelectedMenuItem') ?? ''
	);
	const setOpen = useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === 'function' ? value(open) : value;
			if (setOpenProp) {
				setOpenProp(openState);
			} else {
				_setOpen(openState);
			}

			// This sets the cookie to keep the sidebar state.
			document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
		},
		[setOpenProp, open]
	);

	// Helper to toggle the sidebar.
	const toggleSidebar = useCallback(() => {
		return setOpen((open) => !open);
	}, [setOpen]);

	// Adds a keyboard shortcut to toggle the sidebar.
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
				(event.metaKey || event.ctrlKey)
			) {
				event.preventDefault();
				toggleSidebar();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [toggleSidebar]);

	useEffect(() => {
		localStorage.setItem('sidebarSelectedMenuItem', selectedMenuItem);
	}, [selectedMenuItem]);

	// We add a state so that we can do data-state="expanded" or "collapsed".
	// This makes it easier to style the sidebar with Tailwind classes.
	const state = open ? 'expanded' : 'collapsed';

	const contextValue = useMemo<SidebarContextProps>(
		() => ({
			state: {
				open,
				selectedMenuItem,
				sidebarState: state,
				isMobile,
			},
			actions: {
				setOpen,
				toggleSidebar,
				setSelectedMenuItem,
			},
		}),
		[state, open, setOpen, toggleSidebar, selectedMenuItem, isMobile]
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<Tooltip>
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							'--sidebar-width': SIDEBAR_WIDTH,
							'--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
							...style,
						} as CSSProperties
					}
					className={cn(
						'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
						className
					)}
					{...props}
				>
					{children}
				</div>
			</Tooltip>
		</SidebarContext.Provider>
	);
}

export default SidebarProvider;
