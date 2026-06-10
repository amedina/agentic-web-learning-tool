/**
 * Internal dependencies.
 */
import type { SuppressionPredicates } from "./projectHealthReport";
import type {
  LicenseFinding,
  MuteTarget,
  SuppressionEntry,
  VulnerabilityFinding,
} from "./types";

/**
 * Builds a stable string key for a mute target so the store can dedupe
 * and remove entries. Vulnerability keys include the advisory id;
 * license keys are per-package.
 */
export function suppressionKey(target: MuteTarget): string {
  if (target.kind === "vuln") {
    return `vuln:${target.packageName}:${target.id ?? ""}`;
  }
  return `license:${target.packageName}`;
}

/**
 * True when a vulnerability finding is muted by one of the entries.
 * Matched on (package, advisory id), so a brand-new advisory for the
 * same package is never silenced by an older mute.
 */
export function isVulnerabilitySuppressed(
  entries: SuppressionEntry[],
  finding: VulnerabilityFinding,
): boolean {
  return entries.some(
    (entry) =>
      entry.kind === "vuln" &&
      entry.packageName === finding.packageName &&
      entry.id === finding.id,
  );
}

/** True when a license finding is muted by one of the entries (per package). */
export function isLicenseSuppressed(
  entries: SuppressionEntry[],
  finding: LicenseFinding,
): boolean {
  return entries.some(
    (entry) =>
      entry.kind === "license" && entry.packageName === finding.packageName,
  );
}

/**
 * Builds the {@link SuppressionPredicates} the totals calculation uses,
 * closed over the current set of suppression entries.
 */
export function buildSuppressionPredicates(
  entries: SuppressionEntry[],
): SuppressionPredicates {
  return {
    isVulnerabilitySuppressed: (finding) =>
      isVulnerabilitySuppressed(entries, finding),
    isLicenseSuppressed: (finding) => isLicenseSuppressed(entries, finding),
  };
}
