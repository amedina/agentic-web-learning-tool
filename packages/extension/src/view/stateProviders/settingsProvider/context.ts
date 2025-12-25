/**
 * External dependencies
 */
import { createContext, noop } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import type { SettingsState } from '../../../types';

export type SettingsContextProps = {
	state: SettingsState;
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
	},
	actions: {
		clearSettings: noop,
		toggleSettings: noop,
	},
};
const SettingsContext = createContext<SettingsContextProps>(initialState);

export default SettingsContext;
