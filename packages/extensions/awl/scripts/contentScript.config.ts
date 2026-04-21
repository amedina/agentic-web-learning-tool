/**
 * External dependencies
 */
import { build } from 'vite';
import path, { resolve } from 'path';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagesDir = resolve(__dirname, '../../../');
const aliases = readdirSync(packagesDir)
  .filter((name) => name !== 'shared-config')
  .map((name) => ({
    find: `@google-awlt/${name}`,
    replacement: resolve(packagesDir, name, 'src'),
  }));

const distDir = path.resolve(
  __dirname,
  '../../../../dist/extension/contentScript'
);
const srcDir = resolve(__dirname, '../src');

const entries = {
  mcpBridge: resolve(srcDir, 'contentScript/mcpBridge.ts'),
  registerTools: resolve(srcDir, 'contentScript/registerTools.ts'),
  registerWorkflowTools: resolve(
    srcDir,
    'contentScript/registerWorkflowTools.ts'
  ),
};

const isWatch = process.argv.includes('--watch');
// 1. Determine the value you want to bake into the code
const nodeEnv = isWatch ? 'development' : 'production';
const isDev = nodeEnv === 'development';

// --- The Build Loop ---
const runBuild = async () => {
  const entryKeys = Object.keys(entries);

  for (const [name, entryPath] of Object.entries(entries)) {
    const plugins = [];
    if (name === entryKeys[0]) {
      plugins.push(
        viteStaticCopy({
          targets: [
            {
              src: resolve(srcDir, 'contentScript/assets/webmcp-polyfill.js'),
              dest: '.',
            },
          ],
        })
      );
    }

    await build({
      root: srcDir,
      base: '',
      resolve: {
        alias: aliases,
      },
      plugins: plugins,
      define: {
        'process.env.NODE_ENV': JSON.stringify(nodeEnv),
      },
      build: {
        emptyOutDir: false,
        outDir: distDir,
        minify: !isDev,
        sourcemap: isDev,
        watch: isDev ? {} : null,
        lib: {
          entry: entryPath,
          formats: ['iife'],
          name: `Global_${name}`,
          fileName: () =>
            name === 'mcpBridge' ? 'contentScript.js' : `${name}.js`,
        },
        rollupOptions: {
          output: {
            format: 'iife',
            inlineDynamicImports: true,
          },
        },
      },
    });
  }
};

runBuild();
