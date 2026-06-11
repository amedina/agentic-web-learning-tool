/**
 * External dependencies.
 */
import { fetchModuleReplacements } from "@agentic-web-labs/package-analyzer-core";
import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Internal dependencies.
 */
import type { ProjectFinding } from "../types";

/**
 * Which `package.json` field a dependency was declared in. Surfaced on the
 * finding so UIs can group/colour suggestions and so codemod runners can
 * decide whether to treat dev-only matches differently.
 */
export type DependencyCategory = "runtime" | "dev" | "peer";

/**
 * Subset of the `preferred.json` manifest we consume. The live file has
 * additional metadata that we don't currently use; keeping the shape narrow
 * makes it easy to fixture in tests.
 */
export interface PreferredManifest {
  mappings: Record<
    string,
    {
      type: string;
      moduleName: string;
      replacements: string[];
      url?: { type: string; id: string };
    }
  >;
  replacements?: Record<string, unknown>;
}

export interface FindReplacementOpportunitiesOptions {
  /** Absolute path to the project root that contains `package.json`. */
  rootPath: string;
  /**
   * Optional override for the manifest source. Used by tests to inject a
   * fixture; in production this is fetched lazily from the
   * `es-tooling/module-replacements` repository.
   */
  manifestProvider?: () => Promise<PreferredManifest | null>;
}

export interface FindReplacementOpportunitiesResult {
  findings: ProjectFinding[];
  /**
   * Soft errors. Populated when the manifest could not be fetched or
   * `package.json` could not be parsed; an empty `findings` list with a
   * non-empty `warnings` list is the "we tried but bailed" signal.
   */
  warnings: string[];
}

/**
 * Default manifest provider — fetches `preferred.json` from the
 * `es-tooling/module-replacements` repository via the existing
 * `fetchModuleReplacements` helper (which handles caching for us).
 */
async function defaultManifestProvider(): Promise<PreferredManifest | null> {
  try {
    const raw = (await fetchModuleReplacements(
      "preferred",
    )) as PreferredManifest | null;
    return raw;
  } catch {
    return null;
  }
}

/**
 * Reads and parses `package.json` from `rootPath`. Returns `null` and a
 * descriptive message if the file is missing or malformed; the caller is
 * expected to surface that as a soft warning rather than throw.
 */
async function readPackageJson(
  rootPath: string,
): Promise<
  | { ok: true; data: Record<string, unknown>; absolutePath: string }
  | { ok: false; error: string }
> {
  const absolutePath = path.join(rootPath, "package.json");
  let text: string;
  try {
    text = await fs.readFile(absolutePath, "utf8");
  } catch (error) {
    return {
      ok: false,
      error: `Could not read ${absolutePath}: ${(error as Error).message}`,
    };
  }
  try {
    const data = JSON.parse(text) as Record<string, unknown>;
    return { ok: true, data, absolutePath };
  } catch (error) {
    return {
      ok: false,
      error: `Could not parse ${absolutePath}: ${(error as Error).message}`,
    };
  }
}

/**
 * Returns every dependency declared in `package.json` paired with the
 * field it was declared in. Order follows the typical authoring order
 * (runtime → dev → peer) so deduplication can prefer the first match.
 */
function collectDependencies(
  pkg: Record<string, unknown>,
): { name: string; category: DependencyCategory }[] {
  const buckets: { field: string; category: DependencyCategory }[] = [
    { field: "dependencies", category: "runtime" },
    { field: "devDependencies", category: "dev" },
    { field: "peerDependencies", category: "peer" },
  ];
  const seen = new Set<string>();
  const result: { name: string; category: DependencyCategory }[] = [];
  for (const { field, category } of buckets) {
    const block = pkg[field];
    if (!block || typeof block !== "object") {
      continue;
    }
    for (const name of Object.keys(block as Record<string, unknown>)) {
      if (seen.has(name)) {
        continue;
      }
      seen.add(name);
      result.push({ name, category });
    }
  }
  return result;
}

/**
 * Builds the `e18e.dev` documentation link for a replacement entry, when
 * the manifest provides one. Returns `undefined` when no link should be
 * surfaced (the UI is expected to omit the link gracefully).
 */
function buildReplacementUrl(
  url: { type: string; id: string } | undefined,
): string | undefined {
  if (!url) {
    return undefined;
  }
  if (url.type === "e18e") {
    return `https://e18e.dev/guide/replacements/${url.id}.html`;
  }
  return undefined;
}

/**
 * Scans the top-level dependencies declared in `package.json` and returns a
 * finding for each one that has a known replacement in the `preferred`
 * manifest. Transitive dependencies are intentionally not walked — see the
 * package README for rationale (signal-to-noise in editor surfaces).
 */
export async function findReplacementOpportunities(
  options: FindReplacementOpportunitiesOptions,
): Promise<FindReplacementOpportunitiesResult> {
  const { rootPath, manifestProvider = defaultManifestProvider } = options;
  const warnings: string[] = [];

  const packageJsonResult = await readPackageJson(rootPath);
  if (!packageJsonResult.ok) {
    return { findings: [], warnings: [packageJsonResult.error] };
  }

  const manifest = await manifestProvider();
  if (!manifest || !manifest.mappings) {
    warnings.push(
      "Could not load the preferred-replacements manifest from es-tooling/module-replacements.",
    );
    return { findings: [], warnings };
  }

  const findings: ProjectFinding[] = [];
  for (const dep of collectDependencies(packageJsonResult.data)) {
    const mapping = manifest.mappings[dep.name];
    if (
      !mapping ||
      !mapping.replacements ||
      mapping.replacements.length === 0
    ) {
      continue;
    }
    const replacementsList = mapping.replacements.join(", ");
    const documentationUrl = buildReplacementUrl(mapping.url);
    const message =
      `\`${dep.name}\` has lighter alternatives: ${replacementsList}.` +
      (documentationUrl ? ` See ${documentationUrl}` : "");
    findings.push({
      source: "replacements",
      severity: "info",
      code: "REPLACEMENT_AVAILABLE",
      message,
      file: packageJsonResult.absolutePath,
      data: {
        packageName: dep.name,
        depCategory: dep.category,
        replacements: mapping.replacements,
        documentationUrl,
      },
    });
  }

  return { findings, warnings };
}
