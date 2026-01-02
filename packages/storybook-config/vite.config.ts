import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
	],
	server: {
		port: 6007,     // Use unique port to avoid conflict with docs-design-system (5173)
		strictPort: true, // Fail if port is already taken.
	},
});
