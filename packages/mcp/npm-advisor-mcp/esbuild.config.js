import { build, context } from "esbuild";
import { chmodSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const sharedOptions = {
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
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
