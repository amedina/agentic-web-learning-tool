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

export default function MCPInspectorTab() {
  const { inspectedServerName } = useMcpProvider(({ state }) => ({
    inspectedServerName: state.inspectedServerName,
  }));

  const { setSelectedMenuItem } = useSidebar(({ actions }) => ({
    setSelectedMenuItem: actions.setSelectedMenuItem,
  }));

  useEffect(() => {
    if (inspectedServerName) {
      return;
    }

    setSelectedMenuItem('mcp-server');
  }, [inspectedServerName, setSelectedMenuItem]);

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-10 overflow-auto">
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
        <MCPInspectorTabComponent />
      </div>
    </div>
  );
}
