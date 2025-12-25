export const LOG_OPTS = [
    {
        id: 'TRACE',
        label: 'Trace',
        color: 'bg-status-trace',
        desc: 'All events',
    },
    {
        id: 'DEBUG',
        label: 'Debug',
        color: 'bg-status-debug',
        desc: 'Detailed ops',
    },
    { id: 'INFO', label: 'Info', color: 'bg-status-info', desc: 'Key events' },
    {
        id: 'WARN',
        label: 'Warn',
        color: 'bg-status-warn',
        desc: 'Handled issues',
    },
    { id: 'ERROR', label: 'Error', color: 'bg-status-error', desc: 'Failures' },
    {
        id: 'SILENT',
        label: 'Silent',
        color: 'bg-status-silent',
        desc: 'No logs',
    },
] as const;
