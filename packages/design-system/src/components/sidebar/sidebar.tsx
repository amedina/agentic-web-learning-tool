/**
 * External dependencies
 */
import type { ReactNode } from "react";
/**
 * Internal dependencies
 */
import {
  SidebarMain,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./components"
 
type MenuItem = {
    title: string;
    url: string;
    icon?: () => ReactNode;
}

type SidebarProps = {
    items: MenuItem[]
}
 
export function Sidebar({ items }: SidebarProps) {
  return (
    <SidebarMain>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({title, url, icon}) => (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton asChild>
                    <a href={url}>
                      {icon && icon()}
                      <span>{title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </SidebarMain>
  )
}

export default Sidebar;
