import baseConfig from '../../shared/shared-config/jest/node.js';

const config = {
  ...baseConfig,
  displayName: 'engine-extension',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@agentic-web-labs/engine-core$': '<rootDir>/../engine-core/src/index.ts',
    '^@agentic-web-labs/engine-core/(.*)$': '<rootDir>/../engine-core/src/$1',
  },
};

export default config;
