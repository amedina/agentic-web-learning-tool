const esbuild = require("esbuild");
const { mkdirSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node20",
  sourcemap: !production,
  minify: production,
  logLevel: "info",
};

const VSIX_OUT_DIR = path.resolve(
  __dirname,
  "../../../dist/vscode-npm-advisor",
);

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

async function main() {
  if (watch) {
    const context = await esbuild.context(buildOptions);
    await context.watch();
    return;
  }
  await esbuild.build(buildOptions);
  if (production) {
    packageExtension();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
