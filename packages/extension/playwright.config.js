import baseConfig from '@google-awlt/shared-config/playwright';
import { defineConfig } from '@playwright/test';

export default defineConfig({
	...baseConfig,
	testDir: './src/e2e', // web-specific location
	use: {
		...baseConfig.use,
		baseURL: 'http://localhost:5174', // override if needed
	},
});
