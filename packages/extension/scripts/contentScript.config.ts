/**
 * External dependencies.
 */
import { defineConfig } from 'vite';
import path, { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// points to packages/
const packagesDir = resolve(__dirname, '../../');

const aliases = readdirSync(packagesDir).filter(name => name !== 'shared-config').map((name) => ({
    find: `@google-awlt/${name}`,
    replacement: resolve(packagesDir, name, 'src'),
}));

// dist/extension/contentScript
const distDir = path.resolve(__dirname, '../../../dist/extension/contentScript');

// eslint-disable-next-line turbo/no-undeclared-env-vars
const isDev = process.env.NODE_ENV === 'development';

const target = process.env.TARGET || 'registerTools';

export default defineConfig({
    plugins: [
        target === 'registerTools' ? viteStaticCopy({
            targets: [
                {
                    src: resolve(__dirname, '../src/contentScript/assets/webmcp-polyfill.js'),
                    dest: '.', // copy to root of outDir
                },
            ],
        }) : undefined,
    ].filter(Boolean),
    resolve: {
        alias: aliases,
    },
    base: '',
    root: resolve(__dirname, '../src'), // Set root to packages/extension/src
    build: {
        emptyOutDir: false,
        watch: isDev ? {} : null,
        sourcemap: isDev ? true : false,
        minify: !isDev,
        outDir: distDir,
        rollupOptions: {
            input: {
                [target]: target === 'mcpBridge'
                    ? resolve(__dirname, '../src/contentScript/mcpBridge.ts')
                    : resolve(__dirname, '../src/contentScript/registerTools.ts'),
            },
            output: {
                format: 'iife',
                entryFileNames: (chunk) => {
                    return chunk.name === 'mcpBridge' ? 'contentScript.js' : '[name].js';
                },
                inlineDynamicImports: false,
            }
        }
    }
});
