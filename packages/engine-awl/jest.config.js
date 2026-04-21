import baseConfig from '../shared-config/jest/node.js';

const config = {
  ...baseConfig,
  displayName: 'engine-awl',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@google-awlt/engine-core$': '<rootDir>/../engine-core/src/index.ts',
    '^@google-awlt/engine-core/(.*)$': '<rootDir>/../engine-core/src/$1',
  },
};

export default config;
