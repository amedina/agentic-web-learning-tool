/**
 * External dependencies
 */
import { useState, type Dispatch, type SetStateAction } from 'react';
import {
	AlertOctagon,
} from 'lucide-react';
import { Button } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import type { SettingsState, ThemeMode } from './types';

type ResetConfirmationDialogProps = {
    setSettings: Dispatch<SetStateAction<SettingsState>>;
    setIsResetModalOpen: Dispatch<SetStateAction<boolean>>;
};


export default function ResetConfirmationDialog({ setSettings, setIsResetModalOpen }: ResetConfirmationDialogProps) {
	const [resetInput, setResetInput] = useState('');

	const applyTheme = (mode: ThemeMode) => {
		setSettings((p) => ({ ...p, theme: mode }));
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		if (mode === 'system') {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches)
				root.classList.add('dark');
		} else {
			root.classList.add(mode);
		}
	};

	const handleReset = async () => {
		if (resetInput === 'DELETE') {
			setSettings({ logLevel: 'WARN', theme: 'system' });
			applyTheme('system');
			setIsResetModalOpen(false);
			setResetInput('');
			await chrome.storage.sync.clear();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-extreme-zinc/20 glass"
				onClick={() => setIsResetModalOpen(false)}
			/>
			<div className="relative w-full max-w-md bg-extreme-zinc border border-subtle-zinc shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 duration-200">
				<div className="mb-6 flex flex-col items-center text-center">
					<div className="h-12 w-12 rounded-full bg-baby-red flex items-center justify-center text-danger mb-4">
						<AlertOctagon size={24} />
					</div>
					<h3 className="text-lg font-semibold text-text-primary">
						Confirm Factory Reset
					</h3>
					<p className="mt-2 text-sm text-amethyst-haze">
						Are you absolutely sure? This will return the extension
						to its initial state.
					</p>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3 pt-2">
						<Button
							onClick={() => setIsResetModalOpen(false)}
							className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReset}
							className="px-4 py-2.5 rounded-lg text-sm font-medium shadow-md transition-all"
						>
							Confirm Reset
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
