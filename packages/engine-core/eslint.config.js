/**
 * External dependencies.
 */
import globals from 'globals';

/**
 * Imports.
 */
import { config as baseConfig } from '@google-awlt/shared-config/eslint';
import { config as reactConfig } from '@google-awlt/shared-config/eslint/react';
import { globalIgnores, defineConfig } from 'eslint/config';

/**
 * Export configs.
 */
export default defineConfig([
  ...baseConfig,
  ...reactConfig,
  globalIgnores(['dist']),
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
]);
