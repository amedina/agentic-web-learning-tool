/**
 * External dependencies
 */
import { MCPInspectorTab as MCPInspectorTabComponent } from '@google-awlt/mcp-inspector';
import { useEffect } from 'react';
import { useSidebar } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { useMcpProvider } from '../../providers';
import type { ExtendedMenuItem } from '../../options';

export default function MCPInspectorTab() {
  const { inspectedServerName } = useMcpProvider(({ state }) => ({
    inspectedServerName: state.inspectedServerName,
  }));

  const { setSelectedMenuItem, setMenuItems } = useSidebar(({ actions }) => ({
    setSelectedMenuItem: actions.setSelectedMenuItem,
    setMenuItems: actions.setMenuItems,
  }));

  useEffect(() => {
    if (inspectedServerName) {
      const updateItemInList = (
        list: ExtendedMenuItem[],
        targetId: string,
        key: string,
        newValue: boolean
      ): ExtendedMenuItem[] => {
        return list.map((item) => {
          if (item.id === targetId) {
            return { ...item, [key]: newValue };
          }

          if (item.items && item.items.length > 0) {
            return {
              ...item,
              items: updateItemInList(item.items, targetId, key, newValue),
            };
          }

          return item;
        });
      };

      setMenuItems((prev) => {
        const newValue = updateItemInList(
          prev,
          'mcp-inspector',
          'isDisabled',
          false
        );
        return newValue;
      });
      return;
    }

    setSelectedMenuItem('mcp-server');
  }, [inspectedServerName, setSelectedMenuItem, setMenuItems]);

  return (
    <div className="min-h-screen w-full bg-background pb-3 pt-6 px-6 md:pb-5 md:pt-10 md:px-10  overflow-auto">
      <div className="max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-semibold text-accent-foreground tracking-tight">
                MCP Inspector
              </h1>
            </div>
            <p className="text-sm text-accent-foreground leading-relaxed">
              Inspect and debug your MCP servers.
            </p>
          </div>
        </div>
      </div>
      <div className="w-full font-sans antialiased mt-6">
        <div className="flex gap-3 items-center">
          <h1 className="font-normal text-accent-foreground text-xl">
            Inspecting Github
          </h1>
        </div>
      </div>
      <div className="w-full font-sans antialiased">
        <MCPInspectorTabComponent />
      </div>
    </div>
  );
}
