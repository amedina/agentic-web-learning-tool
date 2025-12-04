// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';

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
			languageOptions: {
				sourceType: 'commonjs',
				globals: {
					...globals.node,
					...globals.browser,
					...globals.jest,
				},
			},
			rules: {
				'eslint-comments/require-description': 'off',
				'@typescript-eslint/no-var-requires': 'off',
				'@typescript-eslint/no-require-imports': 'off',
				'no-redeclare': 'off',
			},
		},
	],
	storybook.configs['flat/recommended']
);
