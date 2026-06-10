/**
 * External dependencies.
 */
import {
  checkLicenseCompatibility,
  fetchNpmPackage,
  fetchOsvAdvisoriesBatch,
  type OsvAdvisoryRecord,
} from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { deriveAdvisoryId, normalizeSeverity } from "./projectHealthReport";
import type { LicenseFinding, VulnerabilityFinding } from "./types";

/** Matches a clean semver version (not a range, tag, or sentinel). */
const CLEAN_SEMVER = /^\d+\.\d+\.\d+(?:[-+][\w.+-]+)?$/;

/**
 * A batched vulnerability fetcher: given a list of unique dependency
 * entries, returns a map (keyed `name@versionKey`) of findings. Backed
 * by OSV's querybatch so a whole monorepo is checked in a few requests.
 */
export type VulnerabilityFetcher = (
  entries: Array<{ name: string; versionKey: string }>,
  signal?: AbortSignal,
) => Promise<Map<string, VulnerabilityFinding[]>>;

/** A per-dependency license-issue fetcher (registry metadata + matrix). */
export type LicenseFetcher = (
  name: string,
  versionKey: string,
  signal?: AbortSignal,
) => Promise<LicenseFinding | null>;

/** Builds the map key for a (name, versionKey) pair. */
function entryKey(name: string, versionKey: string): string {
  return `${name}@${versionKey}`;
}

/**
 * Maps the OSV advisory records for one (name, versionKey) into
 * VulnerabilityFindings. Prefers the GHSA id (then a canonical id, then
 * a url/summary-derived id) so the suppression key stays stable across
 * sources. Returns an empty array for a null/empty record set.
 */
export function vulnerabilityFindingsFromOsv(
  name: string,
  versionKey: string,
  records: OsvAdvisoryRecord[] | null,
): VulnerabilityFinding[] {
  if (!records) {
    return [];
  }
  return records.map((record) => ({
    packageName: name,
    version: versionKey,
    severity: normalizeSeverity(record.severity),
    summary: record.summary,
    url: record.html_url,
    id:
      record.ghsa_id ??
      record.canonicalIds[0] ??
      deriveAdvisoryId(record.html_url, record.summary),
  }));
}

/**
 * Creates the OSV-backed batched vulnerability fetcher. Clean semver
 * version keys are passed through so OSV filters to the affected
 * version; non-semver keys (e.g. the `latest` sentinel) omit the version
 * so OSV reports any advisory for the package.
 */
export function createVulnerabilityFetcher(): VulnerabilityFetcher {
  return async (entries, signal) => {
    const queries = entries.map((entry) => ({
      name: entry.name,
      version: CLEAN_SEMVER.test(entry.versionKey)
        ? entry.versionKey
        : undefined,
    }));
    const results = await fetchOsvAdvisoriesBatch(queries, signal);
    const map = new Map<string, VulnerabilityFinding[]>();
    entries.forEach((entry, index) => {
      map.set(
        entryKey(entry.name, entry.versionKey),
        vulnerabilityFindingsFromOsv(
          entry.name,
          entry.versionKey,
          results[index] ?? null,
        ),
      );
    });
    return map;
  };
}

/**
 * Extracts a license string from an npm registry document for a given
 * version key, falling back to the latest published version. Handles the
 * legacy `{ type }` object form. Returns null when no license is found.
 */
export function licenseFromRegistry(
  data: unknown,
  versionKey: string,
): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const doc = data as {
    license?: unknown;
    "dist-tags"?: { latest?: string };
    versions?: Record<string, { license?: unknown } | undefined>;
  };
  const latest = doc["dist-tags"]?.latest;
  const versionDoc =
    (versionKey !== "latest" ? doc.versions?.[versionKey] : undefined) ??
    (latest ? doc.versions?.[latest] : undefined);
  const raw = versionDoc?.license ?? doc.license;
  if (typeof raw === "string") {
    return raw;
  }
  if (
    raw &&
    typeof raw === "object" &&
    typeof (raw as { type?: unknown }).type === "string"
  ) {
    return (raw as { type: string }).type;
  }
  return null;
}

/**
 * Maps an npm registry document plus the project's target license into a
 * LicenseFinding, or null when the license is missing or compatible.
 */
export function licenseFindingFromRegistry(
  name: string,
  versionKey: string,
  data: unknown,
  targetLicense: string,
): LicenseFinding | null {
  const license = licenseFromRegistry(data, versionKey);
  if (!license) {
    return null;
  }
  const compatibility = checkLicenseCompatibility(license, targetLicense);
  if (!compatibility || compatibility.isCompatible) {
    return null;
  }
  return {
    packageName: name,
    version: versionKey,
    license,
    explanation: compatibility.explanation ?? null,
  };
}

/**
 * Creates a license fetcher bound to a target license. Reads registry
 * metadata (generous, cached) for each dependency and flags incompatible
 * licenses. Network failures yield null rather than throwing so one
 * unreachable package never aborts the run.
 */
export function createLicenseFetcher(targetLicense: string): LicenseFetcher {
  return async (name, versionKey, signal) => {
    let data: unknown;
    try {
      data = await fetchNpmPackage(name, signal);
    } catch {
      return null;
    }
    return licenseFindingFromRegistry(name, versionKey, data, targetLicense);
  };
}
