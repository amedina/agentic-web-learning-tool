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
import type { SettingsState } from './types';

export default function SettingsTab() {
	const [settings, setSettings] = useState<SettingsState>({
		logLevel: 'WARN',
		theme: 'system',
	});
	const [isResetModalOpen, setIsResetModalOpen] = useState(false);

	return (
		<OptionsPageTab title="Settings" description="Manage your extension settings, customize themes, and handle data storage options.">
			<ThemeSection />
			<SystemSection />
			<DataManagementSection
				settings={settings}
				setIsResetModalOpen={setIsResetModalOpen}
			/>
			{isResetModalOpen && (
				<ResetConfirmationDialog
					setSettings={setSettings}
					setIsResetModalOpen={setIsResetModalOpen}
				/>
			)}
		</OptionsPageTab>
	);
}
