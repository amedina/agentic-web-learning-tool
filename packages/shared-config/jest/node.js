/** @type {import('jest').Config} */
export default {
    preset: "ts-jest/presets/js-with-ts",
    testEnvironment: "node",
    clearMocks: true,
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    modulePathIgnorePatterns: ["<rootDir>/node_modules", "<rootDir>/dist"],
    collectCoverage: true,
    verbose: process.env.RUNNER_DEBUG === "1",
    silent: process.env.RUNNER_DEBUG !== "1",
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    }
};
