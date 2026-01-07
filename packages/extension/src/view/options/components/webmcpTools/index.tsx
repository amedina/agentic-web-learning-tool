import { WebMCPToolsTab as WebMCPToolsUI } from '@google-awlt/design-system';

/**
 * Internal Dependencies.
 */
import { useToolProvider } from '../../providers';
import { useSettings } from '../../../stateProviders';

export function WebMCPToolsTab() {
	const { userTools, builtInTools, saveUserTools, saveBuiltInState } =
		useToolProvider(({ state, actions }) => ({
			userTools: state.userTools,
			builtInTools: state.builtInTools,
			saveUserTools: actions.saveUserTools,
			saveBuiltInState: actions.saveBuiltInState,
		}));

	const { isDarkMode } = useSettings(({ state }) => ({
		isDarkMode: state.isDarkMode,
	}));

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
