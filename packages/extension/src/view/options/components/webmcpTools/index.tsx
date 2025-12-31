/**
 * External dependencies.
 */
import { useEffect, useCallback } from 'react';
import {
	WebMCPToolsTab as WebMCPToolsUI,
	type WebMCPTool,
} from '@google-awlt/design-system';

/**
 * Internal Dependencies.
 */
import { useToolProvider } from '../../providers';

export function WebMCPToolsTab() {
	const { userTools, builtInTools, saveUserTools, saveBuiltInState } =
		useToolProvider(({ state, actions }) => ({
			userTools: state.userTools,
			builtInTools: state.builtInTools,
			saveUserTools: actions.saveUserTools,
			saveBuiltInState: actions.saveBuiltInState
		}));

	return (
		<WebMCPToolsUI
			userTools={userTools}
			builtInTools={builtInTools}
			onSaveUserTools={saveUserTools}
			onSaveBuiltInState={saveBuiltInState}
		/>
	);
}
