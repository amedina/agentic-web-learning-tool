// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

/**
 * Imports.
 */
import { config as baseConfig } from '@google-awlt/shared-config/eslint';
import reactRefresh from 'eslint-plugin-react-refresh';
import { globalIgnores, defineConfig } from 'eslint/config';

/**
 * Export configs.
 */
export default defineConfig(
	[
		...baseConfig,
		globalIgnores(['dist']),
		{
			files: ['**/*.{ts,tsx}'],
			extends: [reactRefresh.configs.vite],
		},
		{
			files: ['**/jest.*.js', '**/*.cjs'],
			env: {
				node: true,
				'jest/globals': true,
			},
			rules: {
				'eslint-comments/require-description': 'off',
				'@typescript-eslint/no-var-requires': 'off',
			},
		},
	],
	storybook.configs['flat/recommended']
);
