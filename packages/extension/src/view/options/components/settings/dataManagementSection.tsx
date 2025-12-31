/**
 * External dependencies
 */
import {
	useState,
	useRef,
	type Dispatch,
	type SetStateAction,
	useCallback,
	type ChangeEvent,
} from 'react';
import { Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Button, OptionsPageTabSection } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import type { SettingsType } from '../../../../types';
import { logger, settingsValidator } from '../../../../utils';

type DataManagementSectionProps = {
	settings: SettingsType;
	setIsResetModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function DataManagementSection({
	settings,
	setIsResetModalOpen,
}: DataManagementSectionProps) {
	const [isExporting, setIsExporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isImporting, setIsImporting] = useState(false);

	const handleExport = useCallback(() => {
		setIsExporting(true);

		const now = new Date();
		const date = now.toISOString().split('T')[0];
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const filename = `AWL-backup-${date}-${hours}-${minutes}.json`;

		setTimeout(() => {
			const dataStr =
				'data:text/json;charset=utf-8,' +
				encodeURIComponent(JSON.stringify(settings, null, 2));
			const a = document.createElement('a');
			a.href = dataStr;
			a.download = filename;
			a.click();
			setIsExporting(false);
		}, 600);
	}, [settings]);

	const handleImport = useCallback((event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];

		if (!file) {
			return;
		}
		setIsImporting(true);
		const reader = new FileReader();
		reader.onload = async (_event) => {
			if (!_event.target) {
				logger(['error'], ['Invalid file.']);
				return;
			}

			if (!_event.target?.result) {
				logger(['error'], ['Empty file content']);
				return;
			}

			const settings = JSON.parse(
				(_event.target.result ?? '{}') as string
			);

			const validationResult = settingsValidator(settings);
			if (typeof validationResult === 'boolean') {
				logger(['error'], ['Invalid json file']);
				return;
			}

			await chrome.storage.local.clear();
			await chrome.storage.sync.clear();

			await chrome.storage.sync.set({
				extensionSettings: JSON.stringify(
					validationResult.extensionSettings
				),
			});
			await chrome.storage.sync.set({
				apiKeys: validationResult.apiKeys,
			});
			await chrome.storage.local.set({
				userWebMCPTools: validationResult.userWebMCPTools,
			});

			logger(
				['info', 'debug', 'trace'],
				[
					'Validation successfull, settings have been imported reloading options page',
				]
			);

			setTimeout(() => {
				window.location.reload();
			}, 1000);
			setIsImporting(false);
		};

		reader.onerror = (_event) => {
			if (_event.target?.error) {
				logger(
					['error'],
					['Error reading file: ', _event.target.error]
				);
			}
		};

		reader.readAsText(file);
	}, []);

	return (
		<OptionsPageTabSection title="Data & Storage">
			<div className="gap-5 flex flex-col sm:flex-row">
				<Button
					disabled={isExporting}
					variant="outline"
					onClick={handleExport}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors max-w-[200px]"
				>
					{isExporting ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<Download size={16} />
					)}
					Export Configuration
				</Button>
				<Button
					disabled={isImporting}
					variant="outline"
					onClick={() => fileInputRef.current?.click()}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors max-w-[200px]"
				>
					{isImporting ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<Upload size={16} />
					)}
					Import Configuration
				</Button>
				<input
					onChange={handleImport}
					type="file"
					ref={fileInputRef}
					className="hidden"
					accept=".json"
				/>
			</div>
			<div className="mt-8 rounded-xl border border-baby-red bg-baby-red p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				<div className="space-y-1">
					<h4 className="text-sm font-bold text-danger flex items-center gap-2">
						<AlertTriangle size={16} /> Factory Reset
					</h4>
					<p className="text-xs text-amethyst-haze max-w-sm leading-relaxed">
						This will permanently delete all local storage, API
						keys, and custom agents. This action cannot be undone.
					</p>
				</div>
				<Button
					variant="destructive"
					onClick={() => setIsResetModalOpen(true)}
				>
					Reset Data
				</Button>
			</div>
		</OptionsPageTabSection>
	);
}
