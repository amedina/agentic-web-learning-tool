import { config } from '@google-awlt/shared-config/eslint/react';

/** @type {import("eslint").Linter.Config} */
export default {
    ...config,
    "overrides": [
    {
      "files": ["**/jest.*.js", "**/*.cjs"],
      "env": {
        "node": true,
        "jest/globals": true
      },
      "rules": {
        "eslint-comments/require-description": "off",
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ]
}
