import { WebMCPToolsTab as WebMCPToolsUI } from '@google-awlt/design-system';

/**
 * Internal Dependencies.
 */
import { useToolProvider } from '../../providers';
import { useIsDarkMode } from '../../../stateProviders';

export function WebMCPToolsTab() {
	const { userTools, builtInTools, saveUserTools, saveBuiltInState } =
		useToolProvider(({ state, actions }) => ({
			userTools: state.userTools,
			builtInTools: state.builtInTools,
			saveUserTools: actions.saveUserTools,
			saveBuiltInState: actions.saveBuiltInState,
		}));

	const isDarkMode = useIsDarkMode();

	return (
		<WebMCPToolsUI
			userTools={userTools}
			builtInTools={builtInTools}
			onSaveUserTools={saveUserTools}
			onSaveBuiltInState={saveBuiltInState}
			isDarkMode={isDarkMode}
		/>
	);
}
