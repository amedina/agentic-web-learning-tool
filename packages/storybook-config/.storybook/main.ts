import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const getAbsolutePath = (value: string): any => {
	return path.dirname(require.resolve(path.join(value, 'package.json')));
};

const config: StorybookConfig = {
	stories: [
		// Look for stories inside design-system components
		'../../design-system/src/components/**/*.stories.@(js|jsx|ts|tsx)',
		// Look for stories inside extension components
		'../../extension/src/**/*.stories.@(js|jsx|ts|tsx)',
	],
	addons: [
		getAbsolutePath('@chromatic-com/storybook'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('@storybook/addon-onboarding'),
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-vitest'),
	],
	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},
	async viteFinal(config) {
		return mergeConfig(config, {
			resolve: {
				alias: {
					'@google-awlt/design-system': path.resolve(
						__dirname,
						'../../design-system/src'
					),
					'@google-awlt/extension': path.resolve(
						__dirname,
						'../../extension/src'
					),
				},
			},
		});
	},
};
export default config;
