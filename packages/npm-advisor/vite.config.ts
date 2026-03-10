import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path, { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../../dist/npm-advisor');

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [{ src: resolve(__dirname, 'src/manifest.json'), dest: '' }],
    }),
  ],
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
        popup: resolve(__dirname, 'src/view/popup/popup.html'),
      },
      output: {
        entryFileNames: '[name]/[name].js',
      },
    },
  },
});
