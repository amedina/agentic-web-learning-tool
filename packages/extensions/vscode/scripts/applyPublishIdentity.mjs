/**
 * External dependencies.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const packageDir = resolve(here, "..");
const envPath = resolve(packageDir, ".env");
const packageJsonPath = resolve(packageDir, "package.json");

/**
 * Parses a minimal KEY=VALUE .env file into a plain object. Blank lines
 * and `#` comments are ignored; surrounding single or double quotes are
 * stripped from values.
 * @param {string} contents - Raw .env file contents.
 * @returns {Record<string, string>} Parsed key/value pairs.
 */
function parseEnv(contents) {
  const result = {};
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * Writes the publisher id from the local .env (VSCE_PUBLISHER) into
 * package.json. vsce reads the publisher straight from package.json and
 * offers no CLI override, so the owner/client can target their own
 * Marketplace publisher without editing a tracked file: set VSCE_PUBLISHER
 * in .env (gitignored) and run `pnpm apply:identity` before packaging.
 * Only the publisher is touched on purpose; the extension name is the pnpm
 * workspace name that `pnpm --filter` targets, so it must not change.
 */
function main() {
  if (!existsSync(envPath)) {
    console.error(
      `No .env found at ${envPath}.\nCopy .env.example to .env and set VSCE_PUBLISHER first.`,
    );
    process.exit(1);
  }

  const env = parseEnv(readFileSync(envPath, "utf8"));
  const publisher = (env.VSCE_PUBLISHER ?? "").trim();

  if (publisher === "") {
    console.error("VSCE_PUBLISHER is empty in .env. Set it to your Marketplace publisher id.");
    process.exit(1);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const previous = packageJson.publisher;
  packageJson.publisher = publisher;
  writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

  console.log(`Set package.json publisher: ${previous} -> ${publisher}`);
  console.log("The publisher id is case-sensitive; it must match your registered publisher exactly.");
}

main();
