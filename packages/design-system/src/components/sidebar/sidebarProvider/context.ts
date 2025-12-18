import React from "react";

export type SidebarContextProps = {
    state: 'expanded' | 'collapsed';
    open: boolean;
    setOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    selectedMenuItem: string;
    setSelectedMenuItem: React.Dispatch<React.SetStateAction<string>> 
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

export default SidebarContext;