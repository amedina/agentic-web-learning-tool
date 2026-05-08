import { build, context } from "esbuild";
import { chmodSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: [resolve(__dirname, "src/server.ts")],
  bundle: true,
  outfile: resolve(__dirname, "dist/server.js"),
  format: "esm",
  platform: "node",
  target: "node20",
  // Resolve ESM entry points first so the MCP SDK and analyzer-core
  // ship their published-as-esm builds rather than pulling in CJS
  // transpiler shims that don't tree-shake.
  mainFields: ["module", "main"],
  banner: {
    // Shebang so `npx @agentic-web-labs/npm-advisor-mcp` and
    // chmod +x dist/server.js both work as plain executables.
    js: "#!/usr/bin/env node",
  },
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

function markExecutable() {
  // Bundlers strip the executable bit from the output file; restore
  // it so the bin entry in package.json works without consumers
  // having to chmod it themselves.
  chmodSync(buildOptions.outfile, 0o755);
}

async function main() {
  if (watch) {
    const ctx = await context(buildOptions);
    await ctx.watch();
    return;
  }
  await build(buildOptions);
  markExecutable();
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
