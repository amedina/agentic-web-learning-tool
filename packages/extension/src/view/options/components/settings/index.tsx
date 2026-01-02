/**
 * External dependencies
 */
import { useState } from 'react';
import { OptionsPageTab } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import ResetConfirmationDialog from './resetConfirmationDialog';
import ThemeSection from './themeToggleSection';
import DataManagementSection from './dataManagementSection';
import SystemSection from './systemSection';
import { useSettings } from '../../../stateProviders';

export default function SettingsTab() {
	const { theme, logLevel, clearSettings, toggleSettings } = useSettings(
		({ state, actions }) => ({
			theme: state.theme,
			logLevel: state.logLevel,
			clearSettings: actions.clearSettings,
			toggleSettings: actions.toggleSettings,
		})
	);
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);

	return (
		<OptionsPageTab
			title="Settings"
			description="Manage your extension settings, customize themes, and handle data storage options."
		>
			<ThemeSection toggleSettings={toggleSettings} theme={theme} />
			<SystemSection
				toggleSettings={toggleSettings}
				logLevel={logLevel}
			/>
			<DataManagementSection
				settings={{ theme, logLevel }}
				setIsResetModalOpen={setIsResetModalOpen}
			/>
			{isResetModalOpen && (
				<ResetConfirmationDialog
					clearSettings={clearSettings}
					setIsResetModalOpen={setIsResetModalOpen}
				/>
			)}
		</OptionsPageTab>
	);
}
