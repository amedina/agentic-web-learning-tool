// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

/**
 * Imports.
 */
import { config as baseConfig } from '@google-awlt/shared-config/eslint';
import { config as reactConfig  } from '@google-awlt/shared-config/eslint/react';
import tseslint from 'typescript-eslint';
import reactRefresh from 'eslint-plugin-react-refresh';
import { globalIgnores } from 'eslint/config';

/**
 * Export configs.
 */
export default tseslint.config(
	[
		...baseConfig,
		...reactConfig,
		globalIgnores(['dist']),
		{
			files: ['**/*.{ts,tsx}'],
			extends: [reactRefresh.configs.vite],
		},
	],
	storybook.configs['flat/recommended']
);
