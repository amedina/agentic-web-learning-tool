/**
 * External dependencies
 */
import { useState } from 'react';
import { Settings } from 'lucide-react';
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
		<div className="min-h-screen w-full bg-background p-6 md:p-12">
			<div className="max-w-6xl mx-auto space-y-8">
				{/* Header Section */}
				<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
					<div>
						<div className="flex items-center gap-3 mb-1">
							<div className="w-8 h-8 bg-accent-foreground text-aswad rounded-lg flex items-center justify-center">
								<Settings className="w-5 h-5" />
							</div>
							<h1 className="text-xl font-bold text-accent-foreground tracking-tight">
								Settings
							</h1>
						</div>
						<p className="text-sm text-accent-foreground max-w-md leading-relaxed">
							Manage your extension settings, customize themes, and handle data
							storage options.
						</p>
					</div>
				</div>
				<div className="w-full font-sans antialiased">
					<main className="mx-auto max-w-3xl px-6 py-10 space-y-12">
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
