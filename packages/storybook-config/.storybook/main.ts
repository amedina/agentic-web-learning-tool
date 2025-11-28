import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'
import path from 'path'

const config: StorybookConfig = {
    stories: [
	    '../../design-system/src/components/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    addons: [
        '@chromatic-com/storybook',
        '@storybook/addon-docs',
        '@storybook/addon-onboarding',
        '@storybook/addon-a11y',
        '@storybook/addon-vitest',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    async viteFinal(config) {
        return mergeConfig(config, {
            resolve: {
                alias: {
                    '@google-awlt/design-system': path.resolve(__dirname, '../../design-system/src'),
                },
            },
        })
    },
}
export default config
