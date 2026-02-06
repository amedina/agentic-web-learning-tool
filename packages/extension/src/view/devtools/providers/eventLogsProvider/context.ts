/**
 * External dependencies
 */
import { createContext, noop } from '@google-awlt/common';
import { type TableData } from '@google-awlt/design-system';

export type EventLogsContextProps = {
  state: {
    eventLoggerData: TableData[];
    selectedKey: string | null;
    lastRunToolName: string | null;
    isToolRunning: boolean;
  };
  actions: {
    setEventLoggerData: (data: TableData[]) => void;
    setSelectedKey: (key: string | null) => void;
    setLastRunToolName: (name: string | null) => void;
    setIsToolRunning: (isToolRunning: boolean) => void;
  };
};

const initialState: EventLogsContextProps = {
  state: {
    eventLoggerData: [],
    selectedKey: null,
    lastRunToolName: null,
    isToolRunning: false,
  },
  actions: {
    setEventLoggerData: noop,
    setSelectedKey: noop,
    setLastRunToolName: noop,
    setIsToolRunning: noop,
  },
};

const EventLogsContext = createContext<EventLogsContextProps>(initialState);

export default EventLogsContext;
