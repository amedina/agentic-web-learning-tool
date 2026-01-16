/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';
import { MCPInspectorTab as MCPInspectorTabComponent } from '@google-awlt/mcp-inspector';
import { Client } from '@modelcontextprotocol/sdk/client';

const MCPClient = new Client({ name: 'MCP Inspector', version: '1.0.0' });
export default function MCPInspectorTab() {
  return (
    <OptionsPageTab
      title="MCP Inspector"
      description="Inspect and debug your MCP servers."
    >
      <MCPInspectorTabComponent client={MCPClient} />
    </OptionsPageTab>
  );
}
