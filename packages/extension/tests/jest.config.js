import baseConfig from '@google-awlt/shared-config/jest/react';
import { resolve } from 'path';

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  displayName: 'design-system',
  rootDir: '../',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.cjs'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  transformIgnorePatterns: ['<rootDir>node_modules/'],
  testMatch: ['<rootDir>/src/**/tests/*.{ts,tsx}'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '@assistant-ui/tap/react': resolve(
      '../../node_modules/.pnpm/node_modules/@assistant-ui/tap/dist/react/index.js'
    ),
    '@assistant-ui/tap': resolve(
      '../../node_modules/.pnpm/node_modules/@assistant-ui/tap/dist/index.js'
    ),
    '@mcp-b/extension-tools': resolve(
      '../extension/node_modules/@mcp-b/extension-tools/dist/index.js'
    ),
    '@mcp-b/smart-dom-reader/bundle-string': resolve(
      '../../node_modules/.pnpm/node_modules/@mcp-b/smart-dom-reader/dist/bundle-string.js'
    ),
    '@mcp-b/smart-dom-reader': resolve(
      '../../node_modules/.pnpm/node_modules/@mcp-b/smart-dom-reader/dist/index.js'
    ),
  },
};

export default config;
