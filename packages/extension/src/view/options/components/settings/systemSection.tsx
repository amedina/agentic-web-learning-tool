/**
 * External dependencies
 */
import { useState } from 'react';
import { Terminal, Check } from 'lucide-react';
import { Button, cn } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import type { LogLevel, SettingsState } from './types';

const LOG_OPTS = [
	{
		id: 'TRACE',
		label: 'Trace',
		color: 'bg-status-trace',
		desc: 'All events',
	},
	{
		id: 'DEBUG',
		label: 'Debug',
		color: 'bg-status-debug',
		desc: 'Detailed ops',
	},
	{ id: 'INFO', label: 'Info', color: 'bg-status-info', desc: 'Key events' },
	{
		id: 'WARN',
		label: 'Warn',
		color: 'bg-status-warn',
		desc: 'Handled issues',
	},
	{ id: 'ERROR', label: 'Error', color: 'bg-status-error', desc: 'Failures' },
	{
		id: 'SILENT',
		label: 'Silent',
		color: 'bg-status-silent',
		desc: 'No logs',
	},
] as const;

export default function SystemSection() {
	const [settings, setSettings] = useState<SettingsState>({
		logLevel: 'WARN',
		theme: 'system',
	});

	return (
		<section className="space-y-6">
			<div className="flex items-center gap-3 border-b border-subtle-zinc pb-2">
				<Terminal className="text-amethyst-haze" size={18} />
				<h2 className="text-sm font-medium uppercase tracking-wider text-amethyst-haze">
					Developer Logs
				</h2>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				{LOG_OPTS.map((opt) => {
					const active = settings.logLevel === opt.id;
					return (
						<Button
							size="lg"
							key={opt.id}
							onClick={() =>
								setSettings({
									...settings,
									logLevel: opt.id as LogLevel,
								})
							}
							variant="ghost"
							className={cn(
								'group relative p-7 flex items-center justify-between rounded-xl border text-left transition-all duration-200',
								active
									? 'bg-surface ring-1 ring-primary shadow-sm'
									: ''
							)}
						>
							<div className="flex items-center gap-3">
								<div
									className={cn(
										'w-2 h-2 rounded-full',
										opt.color
									)}
								/>
								<div>
									<span
										className={cn(
											'block text-sm font-medium',
											active
												? 'text-primary'
												: 'text-amethyst-haze'
										)}
									>
										{opt.label}
									</span>
									<span className="text-xs text-exclusive-plum">
										{opt.desc}
									</span>
								</div>
							</div>
							{active && (
								<Check
									size={14}
									className="text-exclusive-plum animate-in fade-in zoom-in"
								/>
							)}
						</Button>
					);
				})}
			</div>
		</section>
	);
}
