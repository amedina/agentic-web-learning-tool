/**
 * External dependencies
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, cn, OptionsPageTabSection } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import type { LogLevel, SettingsState } from '../../../../types';
import { LOG_OPTS } from '../../../../constants';

export default function SystemSection() {
	const [settings, setSettings] = useState<SettingsState>({
		logLevel: 'WARN',
		theme: 'auto',
	});

	return (
		<OptionsPageTabSection title='Developer Logs' >
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
		</OptionsPageTabSection>
	);
}
