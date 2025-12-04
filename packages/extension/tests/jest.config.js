import baseConfig from '@google-awlt/shared-config/jest/react';

/** @type {import('jest').Config} */
const config = {
	...baseConfig,
	testEnvironment: 'jsdom',
	displayName: 'extension',
	rootDir: '../',
	setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.cjs"],
	testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
};

export default config;
