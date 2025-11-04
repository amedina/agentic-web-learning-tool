/**
 * External dependencies.
 */
// @ts-check
import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./src",
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],
	use: {
		baseURL: "http://localhost:5174", // vite default dev server
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		video: "retain-on-failure"
	},
});
