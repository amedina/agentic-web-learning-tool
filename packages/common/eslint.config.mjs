import { config } from '@google-awlt/shared-config/eslint/react';
import globals from 'globals';

/** @type {import("eslint").Linter.Config} */
export default {
	...config,
	overrides: [
		{
			files: ['**/jest.*.js', '**/*.cjs'],
			languageOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
				globals: {
					...globals.node,
...globals.browser,
					...globals.jest,
				},
			},
			rules: {
				'eslint-comments/require-description': 'off',
				'@typescript-eslint/no-var-requires': 'off',
			},
		},
	],
};
