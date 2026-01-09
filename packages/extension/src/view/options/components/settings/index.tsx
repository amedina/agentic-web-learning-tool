/**
 * External dependencies
 */
import { useMemo, useState } from 'react';
import { OptionsPageTab } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import ResetConfirmationDialog from './resetConfirmationDialog';
import ThemeSection from './themeToggleSection';
import DataManagementSection from './dataManagementSection';
import SystemSection from './systemSection';
import { useSettings } from '../../../stateProviders';
import { useModelProvider, useToolProvider } from '../../providers';
import type { SettingsType } from '../../../../types';
import json from '../../../../manifest.json';
import { EXPORT_JSON_VERSION } from '../../../../constants';

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

	const { userTools } = useToolProvider(({ state }) => ({
		userTools: state.userTools,
	}));

	const { apiKeys } = useModelProvider(({ state }) => ({
		apiKeys: state.apiKeys,
	}));

	const config: SettingsType = useMemo(() => {
		return {
			config: {
				apiKeys,
				extensionSettings: {
					theme,
					logLevel,
				},
				userWebMCPTools: userTools,
			},
			version: EXPORT_JSON_VERSION,
			extensionVersion: json.version,
			timestamp: Date.now(),
		};
	}, [userTools, logLevel, theme, apiKeys]);

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
				settings={config}
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
