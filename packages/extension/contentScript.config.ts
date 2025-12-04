import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagesDir = resolve(__dirname, '../');
const aliases = readdirSync(packagesDir).filter(name => name !== 'shared-config').map((name) => ({
	find: `@google-awlt/${name}`,
	replacement: resolve(packagesDir, name, 'src'),
}));
const distDir = path.resolve(__dirname, '../../dist/extension');

// eslint-disable-next-line turbo/no-undeclared-env-vars
const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
	resolve: {
		alias: aliases,
	},
	base: '',
	root: 'src',
	build: {
		emptyOutDir: false,
		watch: isDev ? {} : null,
		sourcemap: isDev ? true : false,
		minify: !isDev,
		outDir: distDir,
		rollupOptions: {
			input: {
				mcpBridge: resolve(__dirname, 'src/contentScript/mcpBridge.ts'),
			},
			output: {
				format: 'iife',
				entryFileNames: (chunk) => {
					return chunk.name === 'mcpBridge' ? 'contentScript.js' : '[name]/[name].js';
				},
			}
		}
	}
});