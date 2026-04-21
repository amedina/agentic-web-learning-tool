import baseConfig from '../../shared/shared-config/jest/node.js';

const config = {
  ...baseConfig,
  displayName: 'engine-core',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
};

export default config;
