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
		"@assistant-ui/tap/react": resolve("../../node_modules/.pnpm/node_modules/@assistant-ui/tap/dist/react/index.js"),
		"@assistant-ui/tap": resolve("../../node_modules/.pnpm/node_modules/@assistant-ui/tap/dist/index.js"),
	},
};

export default config;
