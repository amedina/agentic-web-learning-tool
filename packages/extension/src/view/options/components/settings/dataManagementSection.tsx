/**
 * External dependencies
 */
import {
	useState,
	useRef,
	type Dispatch,
	type SetStateAction,
	useCallback,
} from 'react';
import {
	Download,
	Upload,
	AlertTriangle,
	Loader2,
} from 'lucide-react';
import { Button } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import type { SettingsState } from './types';

type DataManagementSectionProps = {
	settings: SettingsState;
	setIsResetModalOpen: Dispatch<SetStateAction<boolean>>;
};

export default function DataManagementSection({
	settings,
	setIsResetModalOpen,
}: DataManagementSectionProps) {
	const [isExporting, setIsExporting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleExport = useCallback(() => {
		setIsExporting(true);
		setTimeout(() => {
			const dataStr =
				'data:text/json;charset=utf-8,' +
				encodeURIComponent(JSON.stringify(settings, null, 2));
			const a = document.createElement('a');
			a.href = dataStr;
			a.download = 'config-backup.json';
			a.click();
			setIsExporting(false);
		}, 600);
	}, []);

	return (
		<section className="space-y-6">
			<div className="flex items-center gap-3 border-b border-subtle-zinc pb-2">
				<h2 className="text-sm font-medium uppercase tracking-wider text-amethyst-haze">
					Data & Storage
				</h2>
			</div>

			<div className="gap-5 flex flex-col sm:flex-row">
				<Button
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
					variant="outline"
					onClick={() => fileInputRef.current?.click()}
					className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors max-w-[200px]"
				>
					<Upload size={16} />
					Import Configuration
				</Button>
				<input
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
		</section>
	);
}
