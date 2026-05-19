import { build, context } from "esbuild";
import { chmodSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Optional template engines that `@vue/compiler-sfc` and `consolidate`
// dynamically `require()` (pulled in transitively by `madge` →
// `precinct` for the circular-dependency analyzer in
// project-analyzer-core). None are installed in this repo and the
// JS/TS-focused analyzer never asks for them, but esbuild still
// traces the `require()` calls at bundle time — marking them
// external leaves the literal requires in the bundle and they
// MODULE_NOT_FOUND at runtime only if someone actually tries to
// parse a Vue SFC using one of these template languages. See the
// matching note in packages/extensions/vscode/esbuild.config.js.
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

const sharedOptions = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  // `module-replacements-codemods` and its transitive `@ast-grep/napi`
  // ship a platform-specific `.node` native binding that esbuild
  // cannot bundle. project-analyzer-core only loads them via dynamic
  // import() inside runMigrationCodemods (an analyzer the MCP server
  // doesn't currently expose), but esbuild still tries to follow the
  // dynamic import at bundle time. Keeping both external means the
  // server resolves them at runtime through normal node_modules
  // lookup — works wherever pnpm has installed deps.
  external: [
    "module-replacements-codemods",
    "@ast-grep/napi",
    ...OPTIONAL_TEMPLATE_ENGINES,
  ],
  // Resolve ESM entry points first so the MCP SDK and analyzer-core
  // ship their published-as-esm builds rather than pulling in CJS
  // transpiler shims that don't tree-shake.
  mainFields: ["module", "main"],
  banner: {
    // Shebang so `npx @agentic-web-labs/npm-advisor-mcp` and
    // chmod +x on the output both work as plain executables.
    js: "#!/usr/bin/env node",
  },
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

const entries = [
  {
    in: resolve(__dirname, "src/server.ts"),
    out: resolve(__dirname, "dist/server.js"),
  },
  {
    in: resolve(__dirname, "src/cli/index.ts"),
    out: resolve(__dirname, "dist/cli.js"),
  },
];

function buildOptionsFor(entry) {
  return {
    ...sharedOptions,
    entryPoints: [entry.in],
    outfile: entry.out,
  };
}

function markExecutable(outfile) {
  // Bundlers strip the executable bit from the output file; restore
  // it so the file is directly invokable as a script.
  chmodSync(outfile, 0o755);
}

async function main() {
  if (watch) {
    const contexts = await Promise.all(
      entries.map((entry) => context(buildOptionsFor(entry))),
    );
    await Promise.all(contexts.map((ctx) => ctx.watch()));
    return;
  }
  for (const entry of entries) {
    await build(buildOptionsFor(entry));
    markExecutable(entry.out);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
