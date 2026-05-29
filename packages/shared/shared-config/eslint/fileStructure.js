/**
 * External dependencies.
 */
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

/**
 * Standalone ESLint configuration that enforces the file-organization rules
 * from CLAUDE.md as hard errors:
 *
 *   - `max-lines`: a file may not exceed 500 lines of real code (blank lines
 *     and comments are not counted).
 *   - `react/no-multi-comp`: a file may define only a single React component.
 *
 * This config is intentionally NOT layered on top of the shared base config:
 * the base config loads `eslint-plugin-only-warn`, which downgrades every rule
 * to a warning. Keeping this gate separate lets the two rules fail the build
 * while leaving the rest of the lint setup untouched. It is meant to be passed
 * directly via `eslint -c`.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  {
    ignores: [
      "**/*.test.{ts,tsx}",
      "**/*.spec.{ts,tsx}",
      "**/*.stories.{ts,tsx}",
      "**/tests/**",
      "**/__tests__/**",
      "**/dist/**",
      "**/node_modules/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
      "@typescript-eslint": tseslint.plugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "max-lines": [
        "error",
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      "react/no-multi-comp": [
        "error",
        {
          ignoreStateless: false,
        },
      ],
    },
  },
];

export default config;
