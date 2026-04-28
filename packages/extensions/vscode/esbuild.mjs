import * as esbuild from "esbuild";
import { readdirSync } from "fs";
import { join, resolve } from "path";

const isWatch = process.argv.includes("--watch");
const isProduction = process.argv.includes("--production");

const sharedDir = resolve("../../shared");
const sharedPackageAliases = Object.fromEntries(
  readdirSync(sharedDir).map((name) => [
    `@google-awlt/${name}`,
    join(sharedDir, name, "src", "index.ts"),
  ]),
);

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "out/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: !isProduction,
  minify: isProduction,
  alias: sharedPackageAliases,
  logLevel: "info",
};

if (isWatch) {
  const context = await esbuild.context(options);
  await context.watch();
  console.log("Watching for changes…");
} else {
  await esbuild.build(options);
}
