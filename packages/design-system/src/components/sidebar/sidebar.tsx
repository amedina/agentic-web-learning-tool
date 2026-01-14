/**
 * External dependencies
 */
import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
/**
 * Internal dependencies
 */
import {
  SidebarMain,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
} from './components';
import { OwlIcon } from '../../icons';
import { useSidebar } from './sidebarProvider';

export type MenuItem = {
  id: string;
  title: string;
  icon?: () => ReactNode;
  items?: MenuItem[];
};

type SidebarProps = {
  items: MenuItem[];
  footerItems?: MenuItem[];
  side?: 'left' | 'right';
  sidebarVariant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
};

export function Sidebar({
  items,
  footerItems,
  sidebarVariant = 'sidebar',
  collapsible = 'offcanvas',
  side = 'left',
}: SidebarProps) {
  const { setSelectedMenuItem, sidebarState, selectedMenuItem } = useSidebar(
    ({ state, actions }) => ({
      setSelectedMenuItem: actions.setSelectedMenuItem,
      sidebarState: state.sidebarState,
      selectedMenuItem: state.selectedMenuItem,
    })
  );

  const renderMenuItem = (item: MenuItem) => {
    // Check if any child is selected (recursive check not needed for 1-level depth but good to have)
    const isChildSelected = item.items?.some(
      (subItem) => subItem.id === selectedMenuItem
    );

    if (item.items && item.items.length > 0) {
      return (
        <CollapsiblePrimitive.Root
          key={item.id}
          asChild
          defaultOpen={isChildSelected}
          className="group/collapsible"
        >
          <SidebarMenuItem>
            <CollapsiblePrimitive.CollapsibleTrigger asChild>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={sidebarState === 'collapsed' && isChildSelected}
              >
                {item.icon && item.icon()}
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsiblePrimitive.CollapsibleTrigger>
            <CollapsiblePrimitive.CollapsibleContent>
              <SidebarMenuSub>
                {item.items.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.id}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={selectedMenuItem === subItem.id}
                      className="cursor-pointer"
                    >
                      <div
                        onClick={() => {
                          setSelectedMenuItem(subItem.id);
                        }}
                      >
                        {subItem.icon && subItem.icon()}
                        <span>{subItem.title}</span>
                      </div>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsiblePrimitive.CollapsibleContent>
          </SidebarMenuItem>
        </CollapsiblePrimitive.Root>
      );
    }

    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={selectedMenuItem === item.id}
          className="w-full cursor-pointer"
          tooltip={item.title}
        >
          <div
            onClick={() => {
              setSelectedMenuItem(item.id);
            }}
          >
            {item.icon && item.icon()}
            <span>{item.title}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <SidebarMain variant={sidebarVariant} collapsible={collapsible} side={side}>
      <SidebarHeader className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          <div
            className={`ml-2 ${sidebarState === 'expanded' ? '' : 'hidden'}`}
          >
            <OwlIcon className={`h-6 w-6`} />
          </div>
          <span
            className={`text-lg font-bold ${sidebarState === 'expanded' ? '' : 'hidden'}`}
          >
            AWLT
          </span>
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footerItems && (
        <SidebarFooter>
          <SidebarMenu>{footerItems.map(renderMenuItem)}</SidebarMenu>
        </SidebarFooter>
      )}
    </SidebarMain>
  );
}

export default Sidebar;
