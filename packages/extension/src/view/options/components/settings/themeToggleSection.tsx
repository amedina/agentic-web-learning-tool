/**
 * External dependencies
 */
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button, cn, OptionsPageTabSection } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import type { ThemeMode } from '../../../../types';
import type { SettingsContextProps } from '../../../stateProviders';

type ThemeToggleSectionProps = {
	toggleSettings: SettingsContextProps['actions']['toggleSettings'];
	theme: SettingsContextProps['state']['theme'];
};

export default function ThemeToggleSection({ theme, toggleSettings}: ThemeToggleSectionProps) {
	return (
		<OptionsPageTabSection title="Interface">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h3 className="text-sm font-medium text-text-primary">
						Theme Preference
					</h3>
				</div>
				<div className="flex p-1 bg-extreme-zinc rounded-lg">
					{[
						{ id: 'light', icon: Sun, label: 'Light' },
						{ id: 'auto', icon: Monitor, label: 'Auto' },
						{ id: 'dark', icon: Moon, label: 'Dark' },
					].map((mode) => {
						const isActive = theme === mode.id;
						const Icon = mode.icon;
						return (
							<Button
								key={mode.id}
								variant="ghost"
								onClick={() => toggleSettings('theme', mode.id as ThemeMode)}
								className={cn(
									'relative flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out',
									isActive
										? 'bg-surface text-primary ring-1'
										: ''
								)}
							>
								<Icon size={14} />
								{mode.label}
							</Button>
						);
					})}
				</div>
			</div>
		</OptionsPageTabSection>
	);
}
