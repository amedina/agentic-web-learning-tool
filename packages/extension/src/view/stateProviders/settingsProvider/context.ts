/**
 * External dependencies
 */
import { createContext } from "@google-awlt/common";
/**
 * Internal dependencies
 */
import type { SettingsState } from "../../../types";

export type SettingsContextProps = {
  state: SettingsState;
};

const initialState: SettingsContextProps = {
  state: {
    theme: 'auto',
    logLevel: 'SILENT',
  },
};
const SettingsContext = createContext<SettingsContextProps>(initialState);

export default SettingsContext;
