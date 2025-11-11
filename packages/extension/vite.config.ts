/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
import path, { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packagesDir = resolve(__dirname, '../');
const aliases = readdirSync(packagesDir).map((name) => {
  if(name === 'shared-config'){
	return {
		find: `@google-awlt/${name}`,
  		replacement: resolve(packagesDir, name),
	}
  }else {
	return {
		find: `@google-awlt/${name}`,
  		replacement: resolve(packagesDir, name, 'src'),
	}
  }
});
const distDir = path.resolve(__dirname, '../../dist/extension');

// eslint-disable-next-line turbo/no-undeclared-env-vars
const isDev = process.env.NODE_ENV === 'development';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [react(), tailwindcss(), svgr()],
	resolve: {
		alias: aliases,
	},
	base: '',
	build: {
		emptyOutDir: false,
		watch: isDev ? {} : null,
		sourcemap: isDev ? true : false,
        minify: !isDev,
		rollupOptions: {
			input: {
				options: resolve(__dirname, 'src/options/options.html'),
				devtools: resolve(__dirname, 'src/devtools/devtools.html'),
				sidePanel: resolve(__dirname, 'src/sidepanel/sidePanel.html'),
				popup: resolve(__dirname, 'src/popup/popup.html'),
			},
			output: {
				dir: path.join(distDir, '[name]'),
              	entryFileNames: '[name].js',
			}
		}
	}
});
