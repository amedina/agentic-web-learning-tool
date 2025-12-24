/**
 * External dependencies
 */
import { useState } from 'react';

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
		<div className="min-h-screen w-full bg-background p-6 md:p-10">
			<div className="max-w-6xl mx-auto">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<h1 className="text-3xl font-bold text-accent-foreground tracking-tight">
								Settings
							</h1>
						</div>
						<p className="text-sm text-accent-foreground leading-relaxed">
							Manage your extension settings, customize themes,
							and handle data storage options.
						</p>
					</div>
				</div>
				<div className="w-full font-sans antialiased">
					<main className="max-w-4xl py-10 space-y-12">
						<ThemeSection />
						<SystemSection />
						<DataManagementSection
							settings={settings}
							setIsResetModalOpen={setIsResetModalOpen}
						/>
					</main>
					{isResetModalOpen && (
						<ResetConfirmationDialog
							setSettings={setSettings}
							setIsResetModalOpen={setIsResetModalOpen}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
