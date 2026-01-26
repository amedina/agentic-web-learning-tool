/**
 * External dependencies
 */
import { createContext, noop } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import type { SettingsState } from '../../../types';

export type SettingsContextProps = {
  state: SettingsState & {
    isDarkMode: boolean;
    workflowId: string | null;
    tabData: { [key: string]: chrome.tabs.Tab };
    currentTab: number;
  };
  actions: {
    clearSettings: () => void;
    toggleSettings: (
      key: 'theme' | 'logLevel',
      value: SettingsState['theme'] | SettingsState['logLevel']
    ) => void;
    setWorkflowId: (workflowId: string | null) => void;
  };
};

const initialState: SettingsContextProps = {
  state: {
    theme: 'auto',
    logLevel: 'SILENT',
    isDarkMode: false,
    workflowId: null,
    tabData: {},
    currentTab: 0,
  },
  actions: {
    clearSettings: noop,
    toggleSettings: noop,
    setWorkflowId: noop,
  },
};
const SettingsContext = createContext<SettingsContextProps>(initialState);

export default SettingsContext;
