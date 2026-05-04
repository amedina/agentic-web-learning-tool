/**
 * External dependencies.
 */
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

export interface FormatBadgeOptions {
  targetLicense?: string;
}

/**
 * Build the compact one-line CodeLens badge for a dependency.
 * Returns null if the stats payload contributes nothing visible.
 */
export function formatBadge(
  stats: PackageStats,
  options: FormatBadgeOptions = {},
): string | null {
  const segments: string[] = [];

  if (Number.isFinite(stats.score) && stats.scoreMaxPoints > 0) {
    segments.push(`Score ${stats.score}`);
  }

  if (stats.bundle && stats.bundle.size > 0) {
    segments.push(formatBytesCompact(stats.bundle.size));
  }

  if (stats.securityAdvisories) {
    const total =
      stats.securityAdvisories.critical +
      stats.securityAdvisories.high +
      stats.securityAdvisories.moderate +
      stats.securityAdvisories.low;
    if (total > 0) {
      segments.push(`${total} ${total === 1 ? "advisory" : "advisories"}`);
    }
  }

  if (stats.license) {
    const compat = stats.licenseCompatibility;
    if (compat && options.targetLicense) {
      const mark = compat.isCompatible ? "✓" : "✗";
      segments.push(`${stats.license} ${mark}`);
    } else {
      segments.push(stats.license);
    }
  }

  if (segments.length === 0) {
    return null;
  }
  return segments.join(" · ");
}

/**
 * Compact byte formatter for badge text — picks B / KB / MB based on
 * size, drops decimals at small/large extremes for tighter rendering.
 */
function formatBytesCompact(bytes: number): string {
  const k = 1024;
  if (bytes < k) {
    return `${bytes}B`;
  }
  if (bytes < k * k) {
    return `${Math.round(bytes / k)}KB`;
  }
  const mb = bytes / (k * k);
  const decimals = mb < 10 ? 1 : 0;
  return `${parseFloat(mb.toFixed(decimals))}MB`;
}
