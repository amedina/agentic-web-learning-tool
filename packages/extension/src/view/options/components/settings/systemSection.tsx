/**
 * External dependencies
 */
import { Check } from 'lucide-react';
import { Button, cn, OptionsPageTabSection } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import { LOG_OPTS } from '../../../../utils/constants';
import type { SettingsContextProps } from '../../../stateProviders';

type SystemsSectionProps = {
	toggleSettings: SettingsContextProps['actions']['toggleSettings'];
	logLevel: SettingsContextProps['state']['logLevel'];
};

export default function SystemSection({
	logLevel,
	toggleSettings,
}: SystemsSectionProps) {
	return (
		<OptionsPageTabSection title="Developer Logs">
			<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
				{LOG_OPTS.map((opt) => {
					const active =
						logLevel.toLowerCase() === opt.id.toLowerCase();
					return (
						<Button
							size="lg"
							key={opt.id}
							onClick={() => toggleSettings('logLevel', opt.id)}
							variant="ghost"
							className={cn(
								'group relative p-7 flex items-center justify-between rounded-xl border text-left transition-all duration-200 min-w-fit',
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
