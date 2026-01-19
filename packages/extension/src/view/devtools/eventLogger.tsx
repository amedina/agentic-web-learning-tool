/**
 * External dependencies.
 */
import { useState, useMemo } from 'react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { EventLoggerTable, type Column } from '@google-awlt/design-system';

const EventLogger = () => {
  const { tools } = useMcpClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tools, searchQuery]);

  const selectedTool = useMemo(
    () => tools.find((t) => t.name === selectedToolName),
    [tools, selectedToolName]
  );

  const columns: Column<Tool>[] = [
    {
      header: 'Name',
      width: 'w-[30%]',
      render: (tool) => tool.name,
    },
    {
      header: 'Description',
      width: 'w-[50%]',
      render: (tool) => tool.description || '-',
    },
    {
      header: 'Schema Type',
      width: 'w-[20%]',
      render: (tool) => tool.inputSchema?.type || 'object',
    },
  ];

  const renderDetail = (tool: Tool) => (
    <>
      <div className="p-2 border-b border-[#f1f3f4]">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          DESCRIPTION
        </div>
        <div className="text-[#202124] select-text text-xs">
          {tool.description || 'No description provided.'}
        </div>
      </div>
      <div className="flex-1 p-2 bg-white max-h-full overflow-auto">
        <div className="text-[10px] font-bold text-[#5f6368] mb-1">
          INPUT SCHEMA
        </div>
        <pre className="font-mono text-[11px] text-[#db4437] whitespace-pre-wrap break-all select-text bg-[#f8f9fa] p-2 rounded border border-[#f1f3f4]">
          {JSON.stringify(tool.inputSchema, null, 2)}
        </pre>
      </div>
    </>
  );

  return (
    <EventLoggerTable
      items={filteredTools}
      columns={columns}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedItem={selectedTool || null}
      onSelectItem={(tool) => setSelectedToolName(tool ? tool.name : null)}
      renderDetail={renderDetail}
      keyExtractor={(tool) => tool.name}
      noItemsMessage="No tools found matching"
    />
  );
};

export default EventLogger;
