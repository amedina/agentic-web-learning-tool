/**
 * External dependencies
 */
import { ChevronRight } from 'lucide-react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { useEffect } from 'react';
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
import { useSidebar, type MenuItem } from './sidebarProvider';
import { Button } from '../button';

type SidebarProps = {
  items?: MenuItem[];
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
  const {
    setSelectedMenuItem,
    sidebarState,
    selectedMenuItem,
    setMenuItems,
    menuItems,
  } = useSidebar(({ state, actions }) => ({
    setMenuItems: actions.setMenuItems,
    setSelectedMenuItem: actions.setSelectedMenuItem,
    sidebarState: state.sidebarState,
    selectedMenuItem: state.selectedMenuItem,
    menuItems: state.menuItems,
  }));

  useEffect(() => {
    if (!items) {
      return;
    }

    setMenuItems(items);
  }, [items, setMenuItems]);

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
                disabled={item?.isDisabled}
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
                  <SidebarMenuSubItem
                    disabled={subItem?.isDisabled}
                    key={subItem.id}
                  >
                    <SidebarMenuSubButton
                      asChild
                      disabled={subItem?.isDisabled}
                      isActive={selectedMenuItem === subItem.id}
                      className="w-full cursor-pointer"
                    >
                      <Button
                        disabled={subItem?.isDisabled}
                        className="justify-start"
                        variant="ghost"
                        onClick={
                          item?.isDisabled
                            ? () => {}
                            : () => setSelectedMenuItem(subItem.id)
                        }
                      >
                        {subItem.icon && subItem.icon()}
                        <span>{subItem.title}</span>
                      </Button>
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
          disabled={item?.isDisabled}
        >
          <Button
            variant="ghost"
            className="justify-start has-[>svg]:px-2"
            onClick={() => {
              setSelectedMenuItem(item.id);
            }}
          >
            {item.icon && item.icon()}
            <span>{item.title}</span>
          </Button>
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
            <SidebarMenu>{menuItems?.map(renderMenuItem)}</SidebarMenu>
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
