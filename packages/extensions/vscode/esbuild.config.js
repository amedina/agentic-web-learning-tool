const esbuild = require("esbuild");
const { mkdirSync, copyFileSync, existsSync, chmodSync } = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Optional template engines that `@vue/compiler-sfc` and `consolidate`
// dynamically `require()` (pulled in transitively by `madge` →
// `precinct` for the circular-dependency analyzer). These are never
// installed in this repo; marking them external leaves the requires
// in the bundle as no-op `require()` calls that throw MODULE_NOT_FOUND
// at runtime — which only happens if a consumer actually tries to
// parse a Vue SFC using one of these template languages, which the
// JS/TS-focused analyzer never does.
const OPTIONAL_TEMPLATE_ENGINES = [
  "atpl",
  "babel-core",
  "bracket-template",
  "coffee-script",
  "dot",
  "dustjs-linkedin",
  "eco",
  "ect",
  "ejs",
  "haml-coffee",
  "hamlet",
  "hamljs",
  "htmling",
  "jazz",
  "jqtpl",
  "just",
  "liquor",
  "marko",
  "mote",
  "mustache",
  "plates",
  "ractive",
  "slm",
  "squirrelly",
  "teacup/lib/express",
  "templayed",
  "toffee",
  "twig",
  "twing",
  "vash",
  "velocityjs",
  "walrus",
  "whiskers",
];

const extensionBuildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  // `vscode` is the host-provided API, never bundled.
  // `module-replacements-codemods` ships a transitive native binding
  // (`@ast-grep/napi`'s .node file) that esbuild cannot bundle. Keeping
  // both external means the bundled extension.js does `require()` them
  // at runtime; they have to be resolvable on the user's filesystem
  // (works in dev / when the extension runs from source) — see the
  // "Migration wizard packaging" note in the README before publishing
  // to the Marketplace, since `vsce package --no-dependencies` strips
  // node_modules and the wizard fails to load otherwise.
  external: [
    "vscode",
    "module-replacements-codemods",
    "@ast-grep/napi",
    ...OPTIONAL_TEMPLATE_ENGINES,
  ],
  format: "cjs",
  platform: "node",
  target: "node20",
  // Prefer ESM entry points so dependencies that ship a UMD `main`
  // (e.g. jsonc-parser) get bundled via their static-import ESM build
  // instead of a UMD wrapper that uses dynamic require() for sub-modules.
  mainFields: ["module", "main"],
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

/**
 * Stubs Vite-svgr style `?react` imports (e.g. `import Icon from "./foo.svg?react"`)
 * with a tiny React functional component that renders nothing. The
 * webview UI doesn't actually render these icons (they live in
 * `@agentic-web-labs/table`, which analyzer-ui only references via
 * design-system's barrel re-export), so a noop is sufficient and keeps
 * the bundle clean.
 */
const stubSvgQueryImportsPlugin = {
  name: "stub-svg-query-imports",
  setup(build) {
    build.onResolve({ filter: /\.svg\?react$/ }, (args) => ({
      path: args.path,
      namespace: "svg-query-stub",
      pluginData: { resolveDir: args.resolveDir },
    }));
    build.onLoad({ filter: /.*/, namespace: "svg-query-stub" }, (args) => ({
      contents:
        "import * as React from 'react';\n" +
        "const StubSvg = (props) => React.createElement('svg', props);\n" +
        "export default StubSvg;\n",
      loader: "js",
      resolveDir: args.pluginData?.resolveDir ?? __dirname,
    }));
  },
};

const webviewBuildOptions = {
  entryPoints: ["src/webview/main.tsx"],
  bundle: true,
  outfile: "dist/webview.js",
  format: "iife",
  platform: "browser",
  target: ["es2022"],
  // Browser-first so packages like `debug` pick their browser entry
  // and avoid pulling in node-builtins (`tty`, `util`).
  mainFields: ["browser", "module", "main"],
  conditions: ["browser", "import", "default"],
  jsx: "automatic",
  loader: { ".svg": "dataurl", ".png": "dataurl" },
  define: {
    "process.env.NODE_ENV": production ? '"production"' : '"development"',
    "process.platform": '""',
  },
  plugins: [stubSvgQueryImportsPlugin],
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

// Separate bundle for the MCP-setup wizard webview. Lives in its own
// entry point so the dependency-stats panel and the wizard can evolve
// independently without dragging each other's bundle weight along.
const mcpWizardBuildOptions = {
  ...webviewBuildOptions,
  entryPoints: ["src/mcp/wizard/main.tsx"],
  outfile: "dist/mcpWizard.js",
};

const VSIX_OUT_DIR = path.resolve(
  __dirname,
  "../../../dist/vscode-npm-advisor",
);

function buildWebviewCss() {
  const sheets = [
    { input: "src/webview/index.css", output: "dist/webview.css" },
    { input: "src/mcp/wizard/index.css", output: "dist/mcpWizard.css" },
  ];
  for (const sheet of sheets) {
    const args = ["tailwindcss", "-i", sheet.input, "-o", sheet.output];
    if (production) {
      args.push("--minify");
    }
    const result = spawnSync("npx", args, {
      stdio: "inherit",
      shell: true,
    });
    if (result.status !== 0) {
      process.exit(result.status ?? 1);
    }
  }
}

function packageExtension() {
  mkdirSync(VSIX_OUT_DIR, { recursive: true });
  const result = spawnSync(
    "vsce",
    ["package", "--no-dependencies", "--out", VSIX_OUT_DIR],
    { stdio: "inherit", shell: true },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

/**
 * Builds (if needed) and copies the standalone MCP server bundle out
 * of @agentic-web-labs/npm-advisor-mcp into dist/mcp/server.js so it
 * ships inside the .vsix. The "Set up MCP for AI clients" command
 * then writes config snippets for Claude Desktop / Cursor / Claude
 * Code that point straight at this bundled binary, removing the
 * need for users to install Node, npm, or any extra package.
 */
function bundleMcpServer() {
  const mcpSource = path.resolve(
    __dirname,
    "../../mcp/npm-advisor-mcp/dist/server.js",
  );
  if (!existsSync(mcpSource)) {
    const buildResult = spawnSync(
      "pnpm",
      ["--filter", "@agentic-web-labs/npm-advisor-mcp", "build"],
      {
        stdio: "inherit",
        shell: true,
        cwd: path.resolve(__dirname, "../../.."),
      },
    );
    if (buildResult.status !== 0) {
      process.exit(buildResult.status ?? 1);
    }
  }
  const mcpDest = path.resolve(__dirname, "dist/mcp/server.js");
  mkdirSync(path.dirname(mcpDest), { recursive: true });
  copyFileSync(mcpSource, mcpDest);
  // Preserve the executable bit so Node's stdio launchers can spawn
  // the file directly when "command": "node" isn't enough on some
  // shells; harmless when consumers always go through `node`.
  chmodSync(mcpDest, 0o755);
}

async function main() {
  if (watch) {
    const extensionContext = await esbuild.context(extensionBuildOptions);
    const webviewContext = await esbuild.context(webviewBuildOptions);
    const mcpWizardContext = await esbuild.context(mcpWizardBuildOptions);
    await Promise.all([
      extensionContext.watch(),
      webviewContext.watch(),
      mcpWizardContext.watch(),
    ]);
    // Tailwind's CLI doesn't accept multiple --input flags, so we run
    // one watcher per stylesheet. The wizard watcher runs in the
    // background and the webview watcher in the foreground keeps the
    // dev process alive — exiting either kills the whole tree.
    spawn(
      "npx",
      [
        "tailwindcss",
        "-i",
        "src/mcp/wizard/index.css",
        "-o",
        "dist/mcpWizard.css",
        "--watch",
      ],
      { stdio: "inherit", shell: true },
    );
    spawnSync(
      "npx",
      [
        "tailwindcss",
        "-i",
        "src/webview/index.css",
        "-o",
        "dist/webview.css",
        "--watch",
      ],
      { stdio: "inherit", shell: true },
    );
    return;
  }

  await Promise.all([
    esbuild.build(extensionBuildOptions),
    esbuild.build(webviewBuildOptions),
    esbuild.build(mcpWizardBuildOptions),
  ]);
  buildWebviewCss();
  bundleMcpServer();

  if (production) {
    packageExtension();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
