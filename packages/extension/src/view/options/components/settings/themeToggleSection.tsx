/**
 * External dependencies
 */
import { useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button, cn, OptionsPageTabSection } from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import type { SettingsState, ThemeMode } from '../../../../types';

export default function ThemeToggleSection() {
	const [settings, setSettings] = useState<SettingsState>({
		logLevel: 'WARN',
		theme: 'auto',
	});

	const applyTheme = (mode: ThemeMode) => {
		setSettings((p) => ({ ...p, theme: mode }));
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		if (mode === 'auto') {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches)
				root.classList.add('dark');
		} else {
			root.classList.add(mode);
		}
	};

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
						{ id: 'system', icon: Monitor, label: 'Auto' },
						{ id: 'dark', icon: Moon, label: 'Dark' },
					].map((m) => {
						const isActive = settings.theme === m.id;
						const Icon = m.icon;
						return (
							<Button
								key={m.id}
								variant="ghost"
								onClick={() => applyTheme(m.id as ThemeMode)}
								className={cn(
									'relative flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ease-out',
									isActive
										? 'bg-surface text-primary ring-1'
										: ''
								)}
							>
								<Icon size={14} />
								{m.label}
							</Button>
						);
					})}
				</div>
			</div>
		</OptionsPageTabSection>
	);
}
