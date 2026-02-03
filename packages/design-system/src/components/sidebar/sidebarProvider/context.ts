/**
 * External dependencies
 */
import { type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createContext, noop } from '@google-awlt/common';

export interface SidebarContextProps {
  state: {
    sidebarState: 'expanded' | 'collapsed';
    open: boolean;
    selectedMenuItem: string;
    isMobile: boolean;
    menuItems: MenuItem[];
    placement: 'options-page' | 'devtools';
  };
  actions: {
    setOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setSelectedMenuItem: Dispatch<SetStateAction<string>>;
    setMenuItems: Dispatch<SetStateAction<MenuItem[]>>;
  };
}

export type MenuItem = {
  id: string;
  title: string;
  icon?: () => ReactNode;
  items?: MenuItem[];
  isDisabled?: boolean;
  onClick?: () => void;
};

const initialState: SidebarContextProps = {
  state: {
    sidebarState: 'expanded',
    open: true,
    selectedMenuItem: '',
    isMobile: false,
    menuItems: [],
    placement: 'options-page',
  },
  actions: {
    setOpen: noop,
    toggleSidebar: noop,
    setSelectedMenuItem: noop,
    setMenuItems: noop,
  },
};
const SidebarContext = createContext<SidebarContextProps>(initialState);

export default SidebarContext;
