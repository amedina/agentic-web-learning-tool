/**
 * External dependencies
 */
import { createContext } from '@agentic-web-labs/common';

export type TabThreadContextProps = {
  state: {
    tabData: { [key: string]: chrome.tabs.Tab };
    lockedThreads: string[];
  };
  actions: {};
};

const initialState: TabThreadContextProps = {
  state: {
    tabData: {},
    lockedThreads: [],
  },
  actions: {},
};
const TabThreadContext = createContext<TabThreadContextProps>(initialState);

export default TabThreadContext;
