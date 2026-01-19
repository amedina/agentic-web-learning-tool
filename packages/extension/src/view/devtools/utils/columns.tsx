/**
 * External dependencies.
 */
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Column } from '@google-awlt/design-system';

/**
 * Internal dependencies.
 */
import type { ToolExecutionLog } from './types';

export const getToolColumns = (
  onRunTool: (tool: Tool) => void
): Column<Tool>[] => [
  { header: 'Name', width: 'w-[30%]', render: (t) => t.name },
  {
    header: 'Description',
    width: 'w-[45%]',
    render: (t) => t.description || '-',
  },
  {
    header: 'Schema',
    width: 'w-[15%]',
    render: (t) => t.inputSchema?.type || 'object',
  },
  {
    header: 'Action',
    width: 'w-[10%]',
    render: (t) => (
      <button
        className="p-1 hover:bg-gray-200 rounded text-green-600 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onRunTool(t);
        }}
        title="Run Tool"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </button>
    ),
  },
];

export const getLogColumns = (): Column<ToolExecutionLog>[] => [
  {
    header: 'Time',
    width: 'w-[15%]',
    render: (l) =>
      new Date(l.startTime).toLocaleTimeString([], {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
  },
  { header: 'Type', width: 'w-[15%]', render: (l) => l.type },
  { header: 'Name', width: 'w-[30%]', render: (l) => l.toolName },
  {
    header: 'Duration',
    width: 'w-[15%]',
    render: (l) => (l.duration !== undefined ? `${l.duration}ms` : '...'),
  },
  {
    header: 'Status',
    width: 'w-[25%]',
    render: (l) => (
      <span
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
          l.status === 'success'
            ? 'bg-green-100 text-green-800'
            : l.status === 'error'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {l.status.toUpperCase()}
      </span>
    ),
  },
];
