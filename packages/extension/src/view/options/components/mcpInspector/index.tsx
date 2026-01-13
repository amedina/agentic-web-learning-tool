/**
 * External dependencies
 */
import { OptionsPageTab } from '@google-awlt/design-system';

export default function MCPInspectorTab() {
  return (
    <OptionsPageTab
      title="MCP Inspector"
      description="Inspect and debug your MCP servers."
    >
      <iframe
        className="w-[70vw] h-screen"
        src={chrome.runtime.getURL('inspector/index.html')}
      />
    </OptionsPageTab>
  );
}
