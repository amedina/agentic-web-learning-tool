/**
 * Internal Dependencies.
 */
import baseConfig from "./node.js";

/** @type {import('jest').Config} */
export default {
	...baseConfig,
	testEnvironment: "jsdom",
	setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
	transform: {
		"^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.app.json" }],
	},
	extensionsToTreatAsEsm: [".ts", ".tsx"],
	
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",
		"\\.(css|less|scss|sass)$": "identity-obj-proxy",
		"\\.(gif|jpg|jpeg|png|svg)$": "<rootDir>/src/__mocks__/fileMock.js",
	},
};
