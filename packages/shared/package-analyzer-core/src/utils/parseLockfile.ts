/**
 * External dependencies.
 */
import { load as loadYaml } from "js-yaml";
import { gt as semverGt, valid as semverValid } from "semver";

/**
 * Discriminates between the lockfile formats the parser supports. `yarn`
 * is yarn classic (v1); `yarn-berry` is yarn v2+, which is YAML-based and
 * always carries a `__metadata` block at the top of the file.
 */
export type LockfileFormat = "npm" | "pnpm" | "yarn" | "yarn-berry";

export interface ParsedLockfile {
  /** Detected lockfile format. */
  format: LockfileFormat;
  /**
   * Map of top-level (direct) dependency name → installed version, derived
   * from the lockfile. Only direct dependencies of the project root are
   * included. Non-semver resolutions (`git+ssh://`, `file:…`, `npm:alias@…`,
   * `workspace:*`, etc.) are omitted; callers should treat missing names as
   * `latest-fallback`.
   *
   * Yarn lockfiles do not natively distinguish direct from transitive
   * dependencies, so for yarn this map contains every uniquely-named
   * resolution. When multiple resolved versions for the same name exist,
   * the highest semver version is returned. This is an approximation —
   * pass the project's `package.json` ranges separately if exact
   * resolution is required.
   *
   * For a pnpm workspace lockfile this mirrors the root importer
   * (`importers["."]`); use {@link importers} to resolve a specific
   * workspace package.
   */
  topLevel: Record<string, string>;
  /**
   * pnpm workspace lockfiles only: per-importer direct-dependency
   * resolutions, keyed by the importer path the lockfile uses — a posix
   * path relative to the lockfile's directory, with `.` for the root
   * package. A single pnpm `pnpm-lock.yaml` covers every workspace
   * package, so this lets callers resolve a dependency against the exact
   * package that declared it rather than always against the root.
   *
   * Undefined for npm and yarn lockfiles, and for pnpm lockfiles that
   * have no `importers` map (older v5.x single-package layout). Use
   * {@link resolutionsForImporter} to select the right map with a
   * graceful fallback.
   */
  importers?: Record<string, Record<string, string>>;
}

/**
 * Select the direct-dependency resolution map for one importer within a
 * parsed lockfile. For a pnpm workspace lockfile this returns the entry
 * matching `importerPath` (a posix path relative to the lockfile's
 * directory, `.` for the root package). When the lockfile has an importer
 * graph but no entry matches `importerPath`, an empty map is returned so
 * the caller falls back to `latest-fallback` rather than misattributing
 * another package's versions. Lockfiles without an importer graph (npm,
 * yarn, single-package pnpm) fall back to {@link ParsedLockfile.topLevel}.
 *
 * @param parsed - A parsed lockfile from {@link parseLockfile}.
 * @param importerPath - Posix path of the package relative to the
 *   lockfile directory; `.` for the package alongside the lockfile.
 * @returns Map of direct dependency name → installed version.
 */
export function resolutionsForImporter(
  parsed: ParsedLockfile,
  importerPath: string,
): Record<string, string> {
  if (parsed.importers) {
    return parsed.importers[importerPath] ?? {};
  }
  return parsed.topLevel;
}

/**
 * Thrown when the filename isn't a recognised lockfile, or when the file
 * declares a lockfile schema version this parser doesn't know how to read.
 * Callers should treat this as a `latest-fallback` rather than a hard error.
 */
export class UnsupportedLockfileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedLockfileError";
  }
}

/**
 * Parse an npm, pnpm, or yarn lockfile and extract the top-level (direct)
 * dependency resolutions. Format is detected by the lockfile's filename;
 * for `yarn.lock` the parser further distinguishes classic from berry by
 * the presence of a `__metadata` block.
 *
 * This function does not read the filesystem — pass the file contents as
 * a string. Callers are responsible for locating and reading the file.
 *
 * @param filename - The lockfile filename (e.g. `package-lock.json`,
 *   `pnpm-lock.yaml`, `yarn.lock`). Path components are allowed; only
 *   the basename is used for format detection.
 * @param contents - The raw lockfile contents.
 * @returns A {@link ParsedLockfile} with the detected format and the
 *   top-level dependency map.
 * @throws {UnsupportedLockfileError} When the filename isn't a recognised
 *   lockfile or when the file declares an unsupported schema version.
 * @throws {SyntaxError} When the contents are malformed (JSON parse error,
 *   YAML parse error, etc.). Callers should treat these as
 *   `latest-fallback`.
 */
export function parseLockfile(
  filename: string,
  contents: string,
): ParsedLockfile {
  const base = baseName(filename);
  if (base === "package-lock.json" || base === "npm-shrinkwrap.json") {
    return parseNpmLockfile(contents);
  }
  if (base === "pnpm-lock.yaml") {
    return parsePnpmLockfile(contents);
  }
  if (base === "yarn.lock") {
    return parseYarnLockfile(contents);
  }
  throw new UnsupportedLockfileError(
    `Unrecognised lockfile filename: "${filename}". Expected package-lock.json, pnpm-lock.yaml, or yarn.lock.`,
  );
}

/**
 * Return the trailing path component of a possibly nested path. Handles
 * both POSIX and Windows separators. Used to detect the lockfile format
 * from a path like `/some/repo/package-lock.json`.
 */
function baseName(filename: string): string {
  const normalized = filename.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(idx + 1) : normalized;
}

/**
 * Parse a JSON-encoded `package-lock.json` (or `npm-shrinkwrap.json`). The
 * shape changed significantly between npm 5/6 (v1) and npm 7+ (v2/v3) so
 * the two paths are handled separately.
 */
function parseNpmLockfile(contents: string): ParsedLockfile {
  const data = JSON.parse(contents) as Record<string, unknown>;
  const version = data.lockfileVersion;
  if (typeof version !== "number") {
    throw new UnsupportedLockfileError(
      `package-lock.json is missing a numeric "lockfileVersion" field.`,
    );
  }
  if (version === 1) {
    return { format: "npm", topLevel: parseNpmV1(data) };
  }
  if (version === 2 || version === 3) {
    return { format: "npm", topLevel: parseNpmV2(data) };
  }
  throw new UnsupportedLockfileError(
    `Unsupported package-lock.json lockfileVersion: ${String(version)}. Supported: 1, 2, 3.`,
  );
}

/**
 * Extract top-level resolutions from an npm v1 lockfile, where direct
 * dependencies live as keys of the root `dependencies` map.
 */
function parseNpmV1(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const deps = data.dependencies as Record<string, unknown> | undefined;
  if (!deps || typeof deps !== "object") {
    return out;
  }
  for (const [name, raw] of Object.entries(deps)) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const version = (raw as Record<string, unknown>).version;
    if (typeof version === "string" && isResolvableSemver(version)) {
      out[name] = version;
    }
  }
  return out;
}

/**
 * Extract top-level resolutions from an npm v2/v3 lockfile. The root
 * package metadata lives at `packages[""]`, listing direct dep names; each
 * installed package then lives at `packages["node_modules/<name>"]`.
 * Optional deps that didn't install on this platform are silently omitted.
 */
function parseNpmV2(data: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const packages = data.packages as Record<string, unknown> | undefined;
  if (!packages || typeof packages !== "object") {
    return out;
  }
  const root = packages[""];
  if (!root || typeof root !== "object") {
    return out;
  }
  const directNames = collectDirectNames(root as Record<string, unknown>);
  for (const name of directNames) {
    const entry = packages[`node_modules/${name}`];
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const version = (entry as Record<string, unknown>).version;
    if (typeof version === "string" && isResolvableSemver(version)) {
      out[name] = version;
    }
  }
  return out;
}

/**
 * Collect the union of dependency names declared on a root package entry
 * across the four dependency categories. Used by the npm v2/v3 path to
 * determine which packages to look up under `node_modules/`.
 */
function collectDirectNames(rootEntry: Record<string, unknown>): string[] {
  const names = new Set<string>();
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const map = rootEntry[field];
    if (map && typeof map === "object") {
      for (const name of Object.keys(map as Record<string, unknown>)) {
        names.add(name);
      }
    }
  }
  return [...names];
}

/**
 * pnpm-lock.yaml schema versions known to share the importer-graph layout
 * this parser understands. New schema versions land regularly; ones not
 * in this set throw {@link UnsupportedLockfileError} so callers know to
 * fall back to latest rather than silently misreport resolutions.
 */
const SUPPORTED_PNPM_LOCKFILE_VERSIONS = new Set([
  "5.3",
  "5.4",
  "6.0",
  "6.1",
  "9.0",
  "9.1",
]);

/**
 * Parse a `pnpm-lock.yaml`. v5.x stores direct deps as `{ name: version }`
 * at the root; v6+ moves them under `importers["."]` and changes the
 * version field to either a string or an object with `specifier` and
 * `version`. Both shapes are handled by walking the importer entry.
 */
function parsePnpmLockfile(contents: string): ParsedLockfile {
  const data = loadYaml(contents) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") {
    throw new UnsupportedLockfileError(
      `pnpm-lock.yaml is empty or not an object.`,
    );
  }
  const version = String(data.lockfileVersion ?? "");
  if (!SUPPORTED_PNPM_LOCKFILE_VERSIONS.has(version)) {
    throw new UnsupportedLockfileError(
      `Unsupported pnpm-lock.yaml lockfileVersion: ${version}. Supported: ${[...SUPPORTED_PNPM_LOCKFILE_VERSIONS].join(", ")}.`,
    );
  }
  const importers = data.importers as Record<string, unknown> | undefined;
  if (importers && typeof importers === "object") {
    const perImporter: Record<string, Record<string, string>> = {};
    for (const [importerPath, node] of Object.entries(importers)) {
      if (!node || typeof node !== "object") {
        continue;
      }
      const resolutions: Record<string, string> = {};
      mergePnpmImporter(node as Record<string, unknown>, resolutions);
      perImporter[importerPath] = resolutions;
    }
    return {
      format: "pnpm",
      topLevel: perImporter["."] ?? {},
      importers: perImporter,
    };
  }
  const out: Record<string, string> = {};
  mergePnpmImporter(data, out);
  return { format: "pnpm", topLevel: out };
}

/**
 * Walk one pnpm importer entry (or the root of a v5.x lockfile) and copy
 * direct-dependency resolutions into `out`. Tolerates both the v5.x
 * string-version shape and the v6+ object shape with `specifier`/`version`.
 */
function mergePnpmImporter(
  node: Record<string, unknown>,
  out: Record<string, string>,
): void {
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const map = node[field];
    if (!map || typeof map !== "object") {
      continue;
    }
    for (const [name, raw] of Object.entries(map as Record<string, unknown>)) {
      let version: string | null = null;
      if (typeof raw === "string") {
        version = stripPnpmVersion(raw);
      } else if (
        raw &&
        typeof raw === "object" &&
        typeof (raw as Record<string, unknown>).version === "string"
      ) {
        version = stripPnpmVersion(
          (raw as Record<string, unknown>).version as string,
        );
      }
      if (version && isResolvableSemver(version)) {
        out[name] = version;
      }
    }
  }
}

/**
 * pnpm v6+ stores peer-dependency-suffixed versions like
 * `18.2.0(react@18.2.0)`. Strip the parenthetical to recover the bare
 * semver string. Returns `null` for empty input.
 */
function stripPnpmVersion(raw: string): string | null {
  const paren = raw.indexOf("(");
  const stripped = paren >= 0 ? raw.slice(0, paren) : raw;
  const trimmed = stripped.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Detect whether a `yarn.lock` is yarn classic (v1) or yarn berry (v2+)
 * and dispatch to the matching parser. Berry lockfiles always include a
 * `__metadata` block at the top of the file.
 */
function parseYarnLockfile(contents: string): ParsedLockfile {
  if (/^__metadata:/m.test(contents)) {
    return parseYarnBerryLockfile(contents);
  }
  return parseYarnClassicLockfile(contents);
}

/**
 * Hand-written parser for the yarn classic (v1) `yarn.lock` format. The
 * file is a sequence of blocks separated by blank lines; each block has a
 * header line listing one or more comma-separated `name@range` specs
 * followed by indented `key value` lines, of which we only care about
 * `version "<resolved>"`.
 */
function parseYarnClassicLockfile(contents: string): ParsedLockfile {
  const groups: Record<string, string[]> = {};
  const lines = contents.split(/\r?\n/);
  let currentNames: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const isIndented = line.startsWith(" ") || line.startsWith("\t");
    if (!isIndented) {
      const header = line.replace(/:\s*$/, "");
      currentNames = parseYarnHeader(header);
      continue;
    }

    const inner = line.replace(/^\s+/, "");
    const match = inner.match(/^version\s+"?([^"]+)"?\s*$/);
    if (match && currentNames.length > 0) {
      const version = match[1];
      if (isResolvableSemver(version)) {
        for (const name of currentNames) {
          if (!groups[name]) {
            groups[name] = [];
          }
          groups[name].push(version);
        }
      }
      currentNames = [];
    }
  }

  return { format: "yarn", topLevel: flattenHighestPerName(groups) };
}

/**
 * Parse a yarn berry (v2+) `yarn.lock`. Berry's lockfile is YAML and each
 * top-level key is a comma-separated list of `name@locator` specs whose
 * value is an object containing the resolved `version`.
 */
function parseYarnBerryLockfile(contents: string): ParsedLockfile {
  const data = loadYaml(contents) as Record<string, unknown> | null;
  if (!data || typeof data !== "object") {
    throw new UnsupportedLockfileError(
      `yarn.lock (berry) is empty or not an object.`,
    );
  }
  const groups: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(data)) {
    if (key === "__metadata") {
      continue;
    }
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const version = (entry as Record<string, unknown>).version;
    if (typeof version !== "string" || !isResolvableSemver(version)) {
      continue;
    }
    for (const name of parseYarnHeader(key)) {
      if (!groups[name]) {
        groups[name] = [];
      }
      groups[name].push(version);
    }
  }
  return { format: "yarn-berry", topLevel: flattenHighestPerName(groups) };
}

/**
 * Split a yarn lockfile header into the bare package names it references.
 * Headers look like `"react@^18.0.0", "react@^18.2.0"` for yarn classic or
 * `"react@npm:^18.0.0"` for berry. Non-semver locators
 * (`workspace:*`, `file:…`, `link:…`) are dropped — their resolutions
 * can't be used for advisory matching anyway.
 */
function parseYarnHeader(header: string): string[] {
  const names: string[] = [];
  const parts = splitTopLevelCommas(header);
  for (const part of parts) {
    const cleaned = part.trim().replace(/^"|"$/g, "");
    const name = extractNameFromSpec(cleaned);
    if (name) {
      names.push(name);
    }
  }
  return names;
}

/**
 * Split a yarn header by commas that aren't inside quoted segments. Yarn
 * berry sometimes emits headers like
 * `"@scope/name@npm:^1.0.0", "@scope/name@npm:^1.1.0"` where naive
 * splitting on `,` is fine, but we still tolerate inner commas in case a
 * future berry version embeds them in the locator portion.
 */
function splitTopLevelCommas(header: string): string[] {
  const out: string[] = [];
  let buf = "";
  let inQuotes = false;
  for (const ch of header) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      buf += ch;
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf.length > 0) {
    out.push(buf);
  }
  return out;
}

/**
 * Extract the bare package name from a yarn spec like `react@^18.0.0`,
 * `@scope/name@^1.0.0`, or `name@npm:^1.0.0`. Returns `null` for specs
 * that point at non-semver locators (`workspace:*`, `file:…`, `link:…`,
 * `portal:…`, `patch:…`).
 */
function extractNameFromSpec(spec: string): string | null {
  if (!spec) {
    return null;
  }
  const at = spec.lastIndexOf("@");
  if (at <= 0) {
    return spec;
  }
  const locator = spec.slice(at + 1);
  if (
    locator.startsWith("workspace:") ||
    locator.startsWith("file:") ||
    locator.startsWith("link:") ||
    locator.startsWith("portal:") ||
    locator.startsWith("patch:")
  ) {
    return null;
  }
  return spec.slice(0, at);
}

/**
 * Reduce the multi-version yarn working map to a single resolved version
 * per name, picking the highest semver. Documented as approximate in
 * {@link ParsedLockfile.topLevel}.
 */
function flattenHighestPerName(
  groups: Record<string, string[]>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, versions] of Object.entries(groups)) {
    out[name] = pickHighestVersion(versions);
  }
  return out;
}

/**
 * Return the highest semver version from a non-empty list, falling back
 * to the first entry when none parse as valid semver. Callers have
 * already filtered for {@link isResolvableSemver} so this is just a
 * tie-breaker for multi-resolution yarn entries.
 */
function pickHighestVersion(versions: string[]): string {
  let best = versions[0];
  for (let i = 1; i < versions.length; i++) {
    const candidate = versions[i];
    if (
      semverValid(best) !== null &&
      semverValid(candidate) !== null &&
      semverGt(candidate, best)
    ) {
      best = candidate;
    } else if (semverValid(best) === null && semverValid(candidate) !== null) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Test whether a string is a plain semver version — the only kind of
 * resolution this parser surfaces. Returns `false` for non-semver
 * locators (`git+ssh://…`, `file:…`, `npm:alias@…`, `workspace:*`, etc.)
 * which are intentionally excluded from {@link ParsedLockfile.topLevel}.
 */
function isResolvableSemver(version: string): boolean {
  return semverValid(version) !== null;
}
