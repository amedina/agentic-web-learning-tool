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
    tabData: { [key: string]: chrome.tabs.Tab };
  };
  actions: {
    clearSettings: () => void;
    toggleSettings: (
      key: 'theme' | 'logLevel',
      value: SettingsState['theme'] | SettingsState['logLevel']
    ) => void;
  };
};

const initialState: SettingsContextProps = {
  state: {
    theme: 'auto',
    logLevel: 'SILENT',
    isDarkMode: false,
    tabData: {},
  },
  actions: {
    clearSettings: noop,
    toggleSettings: noop,
  },
};
const SettingsContext = createContext<SettingsContextProps>(initialState);

export default SettingsContext;
