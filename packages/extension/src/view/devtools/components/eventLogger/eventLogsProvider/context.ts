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
  };
  actions: {
    setSelectedKey: (key: string | null) => void;
    setLastRunToolName: (name: string | null) => void;
  };
};

const initialState: EventLogsContextProps = {
  state: {
    eventLoggerData: [],
    selectedKey: null,
    lastRunToolName: null,
  },
  actions: {
    setSelectedKey: noop,
    setLastRunToolName: noop,
  },
};

const EventLogsContext = createContext<EventLogsContextProps>(initialState);

export default EventLogsContext;
