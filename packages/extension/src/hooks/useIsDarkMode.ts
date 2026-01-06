/**
 * External dependencies
 */
import { useEffect, useState } from 'react';

/**
 * Internal dependencies
 */
import { useSettings } from '../view/stateProviders';

export function useIsDarkMode(): boolean {
    const { theme } = useSettings(({ state }) => ({
        theme: state.theme,
    }));

    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const updateTheme = () => {
            if (theme === 'dark') {
                setIsDarkMode(true);
            } else if (theme === 'light') {
                setIsDarkMode(false);
            } else {
                // Auto mode
                setIsDarkMode(mediaQuery.matches);
            }
        };

        updateTheme();

        const handleChange = () => {
            if (theme === 'auto') {
                updateTheme();
            }
        };

        // Only attach listener if in auto mode to minimize event listeners
        if (theme === 'auto') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return isDarkMode;
}
