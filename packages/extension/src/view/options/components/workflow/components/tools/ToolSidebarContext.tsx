import { createContext, useContext, type ReactNode } from 'react';

interface ToolSidebarContextProps {
  collapsed: boolean;
}

const ToolSidebarContext = createContext<ToolSidebarContextProps | undefined>(
  undefined
);

export const ToolSidebarProvider = ({
  collapsed,
  children,
}: ToolSidebarContextProps & { children: ReactNode }) => {
  return (
    <ToolSidebarContext.Provider value={{ collapsed }}>
      {children}
    </ToolSidebarContext.Provider>
  );
};

export const useToolSidebar = () => {
  const context = useContext(ToolSidebarContext);
  if (context === undefined) {
    return { collapsed: false };
  }
  return context;
};
