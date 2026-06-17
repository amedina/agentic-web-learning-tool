import { build, context } from "esbuild";
import { chmodSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

// Inline name + version from package.json at build time. The bundle is
// copied into the VSCode extension at `dist/mcp/server.js`, two levels
// deep, so the runtime `../package.json` lookup in version.ts can't find
// it there. Baking the literals in via `define` makes the version
// resolve correctly wherever the bundle ends up; version.ts keeps the
// file read as a fallback for unbundled dev/test runs.
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "package.json"), "utf8"),
);

// Optional template engines that `@vue/compiler-sfc` and `consolidate`
// dynamically `require()` (pulled in transitively by `madge` →
// `precinct` for the circular-dependency analyzer in
// project-analyzer-core). None are installed in this repo and the
// JS/TS-focused analyzer never asks for them, but esbuild still
// traces the `require()` calls at bundle time — marking them
// external leaves the literal requires in the bundle and they
// MODULE_NOT_FOUND at runtime only if someone actually tries to
// parse a Vue SFC using one of these template languages. `lodash` is
// listed here too: it is not a template language itself, but
// consolidate exposes a lodash-template renderer that does
// `require('lodash')`, and lodash is no longer hoisted to a resolvable
// location in this repo. See the matching note in
// packages/extensions/vscode/esbuild.config.js.
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
  "lodash",
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
  define: {
    __NPM_ADVISOR_VERSION__: JSON.stringify(pkg.version),
    __NPM_ADVISOR_NAME__: JSON.stringify(pkg.name),
  },
  banner: {
    // Shebang so `npx @agentic-web-labs/npm-advisor-mcp` and
    // chmod +x on the output both work as plain executables. The
    // require/__filename/__dirname shims restore the CommonJS globals
    // that bundled deps still reference at runtime (ajv's codegen calls
    // `require("path")`; the bundled TypeScript compiler reads
    // `__filename`). Without them esbuild's ESM output throws "Dynamic
    // require of X is not supported" / "__filename is not defined in ES
    // module scope". The shebang must stay the first line.
    js: [
      "#!/usr/bin/env node",
      "import { createRequire as __npmAdvisorCreateRequire } from 'node:module';",
      "import { fileURLToPath as __npmAdvisorFileURLToPath } from 'node:url';",
      "import { dirname as __npmAdvisorDirname } from 'node:path';",
      "const require = __npmAdvisorCreateRequire(import.meta.url);",
      "const __filename = __npmAdvisorFileURLToPath(import.meta.url);",
      "const __dirname = __npmAdvisorDirname(__filename);",
    ].join("\n"),
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
