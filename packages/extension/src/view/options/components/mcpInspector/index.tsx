/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';
import { MCPInspectorTab as MCPInspectorTabComponent } from '@google-awlt/mcp-inspector';

export default function MCPInspectorTab() {
  return (
    <OptionsPageTab
      title="MCP Inspector"
      description="Inspect and debug your MCP servers."
      className="h-svh"
    >
      <MCPInspectorTabComponent />
    </OptionsPageTab>
  );
}
