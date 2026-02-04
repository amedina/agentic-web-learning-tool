/**
 * External dependencies
 */
import { type Dispatch, type SetStateAction } from 'react';
import { createContext, noop } from '@google-awlt/common';

export interface SidebarContextProps {
  state: {
    sidebarState: 'expanded' | 'collapsed';
    open: boolean;
    selectedMenuItem: string;
    isMobile: boolean;
    placement: 'options-page' | 'devtools';
  };
  actions: {
    setOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    setSelectedMenuItem: Dispatch<SetStateAction<string>>;
  };
}

const initialState: SidebarContextProps = {
  state: {
    sidebarState: 'expanded',
    open: true,
    selectedMenuItem: '',
    isMobile: false,
    placement: 'options-page',
  },
  actions: {
    setOpen: noop,
    toggleSidebar: noop,
    setSelectedMenuItem: noop,
  },
};
const SidebarContext = createContext<SidebarContextProps>(initialState);

export default SidebarContext;
