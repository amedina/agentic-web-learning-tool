import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path, { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagesDir = resolve(__dirname, '../');
const decodePath = resolve('../../node_modules/.pnpm');
const decodeDir = path.dirname(decodePath);
const aliases = readdirSync(packagesDir)
  .filter((name) => name !== 'shared-config')
  .map((name) => ({
    find: `@google-awlt/${name}`,
    replacement: resolve(packagesDir, name, 'src'),
  }));
aliases.push({
  find: 'decode-named-character-reference',
  replacement: path.join(
    decodeDir,
    '.pnpm',
    'decode-named-character-reference@1.3.0',
    'node_modules',
    'decode-named-character-reference',
    'index.js'
  ),
});
const distDir = path.resolve(__dirname, '../../dist/awl-extension');
// eslint-disable-next-line turbo/no-undeclared-env-vars
const isDev = process.env.NODE_ENV === 'development';
// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    viteStaticCopy({
      targets: [
        { src: resolve(__dirname, 'src/manifest.json'), dest: '' },
        { src: resolve(__dirname, 'src/icons'), dest: '' },
      ],
    }),
  ],
  resolve: {
    alias: aliases,
  },
  base: '',
  root: 'src/view',
  build: {
    emptyOutDir: false,
    watch: isDev ? {} : null,
    sourcemap: isDev ? true : false,
    minify: !isDev,
    outDir: distDir,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/view/options/options.html'),
        devtools: resolve(__dirname, 'src/view/devtools/devtools.html'),
        'devtools-index': resolve(__dirname, 'src/view/devtools/index.html'),
        sidePanel: resolve(__dirname, 'src/view/sidePanel/sidePanel.html'),
        popup: resolve(__dirname, 'src/view/popup/popup.html'),
        serviceWorker: resolve(__dirname, 'src/serviceWorker/index.ts'),
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'devtools-index'
            ? 'devtools/[name].js'
            : '[name]/[name].js';
        },
      },
    },
  },
});
