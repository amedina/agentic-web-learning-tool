/**
 * External dependencies.
 */
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import type { LocalPackageKind } from "../packageJson/localSpec";

export interface RenderHoverOptions {
  targetLicense?: string;
  now?: () => Date;
  /**
   * The range string as it appears in package.json — `^4.17.0`, `~1.2.3`,
   * `*`, a git URL, etc. Shown alongside the installed and latest version
   * when the hover wants to highlight install/range drift.
   */
  declaredRange?: string;
  /**
   * The resolved version from the user's lockfile, when known. When set,
   * the hover renders the installed/range/latest triplet and marks the
   * data as lockfile-grounded; when omitted, a small "no lockfile —
   * showing latest" footer is rendered instead.
   */
  installedVersion?: string;
}

/**
 * Builds the markdown shown inside a hover popover for a single
 * dependency. Returns a string ready for vscode.MarkdownString. Any
 * field the analyzer didn't populate is silently omitted so missing
 * data never produces broken UI.
 */
export function renderHover(
  stats: PackageStats,
  options: RenderHoverOptions = {},
): string {
  const lines: string[] = [];

  lines.push(`$(extensions-view-icon) **NPM Advisor**`);
  lines.push("");
  lines.push(
    `**${stats.packageName}** — Fitness ${stats.score}/${stats.scoreMaxPoints}`,
  );

  if (stats.description) {
    const description = stats.description.replace(/\s+/g, " ").trim();
    if (description) {
      lines.push("");
      lines.push(description);
    }
  }

  const detailLines: string[] = [];

  if (stats.bundle) {
    const { size, gzip } = stats.bundle;
    detailLines.push(
      `- **Bundle:** ${formatBytes(size)} (gzip ${formatBytes(gzip)})`,
    );
  }

  if (stats.lastCommitDate) {
    const relative = formatRelativeTime(stats.lastCommitDate, options.now);
    if (relative) {
      detailLines.push(`- **Last commit:** ${relative}`);
    }
  }

  if (stats.securityAdvisories) {
    const { critical, high, moderate, low } = stats.securityAdvisories;
    const total = critical + high + moderate + low;
    if (total === 0) {
      detailLines.push(`- **Security:** no known advisories`);
    } else {
      const parts = [
        critical && `${critical} critical`,
        high && `${high} high`,
        moderate && `${moderate} moderate`,
        low && `${low} low`,
      ].filter(Boolean);
      detailLines.push(`- **Security:** ${parts.join(", ")}`);
    }
  }

  if (stats.license) {
    const compat = stats.licenseCompatibility;
    let licenseLine = `- **License:** ${stats.license}`;
    if (compat && options.targetLicense) {
      const tag = compat.isCompatible ? "compatible" : "incompatible";
      licenseLine += ` (${tag} with ${options.targetLicense})`;
    }
    detailLines.push(licenseLine);
  }

  detailLines.push(...buildVersionLines(stats, options));

  if (detailLines.length > 0) {
    lines.push("");
    lines.push(...detailLines);
  }

  const linkParts: string[] = [
    `[Show full insights](command:npmAdvisor.showInsights?${encodeURIComponent(JSON.stringify([stats.packageName]))})`,
    `[View on npm](https://www.npmjs.com/package/${encodeURIComponent(stats.packageName)})`,
  ];
  if (stats.githubUrl) {
    linkParts.push(`[Source](${stats.githubUrl})`);
  }
  lines.push("");
  lines.push(linkParts.join(" · "));

  return lines.join("\n");
}

/**
 * Builds the markdown for a hover over a local (non-registry) dependency:
 * one resolved via `workspace:`, `file:`, `link:`, or `portal:`. These
 * have no published stats, so instead of firing a doomed registry fetch
 * (which leaves VSCode showing a flickering "Loading…") the provider
 * returns this static note explaining where the package comes from.
 */
export function renderLocalPackageHover(
  packageName: string,
  spec: string,
  kind: LocalPackageKind,
): string {
  const source =
    kind === "workspace"
      ? "another package in this workspace"
      : "a local path on disk";
  return [
    `$(extensions-view-icon) **NPM Advisor**`,
    "",
    `**${packageName}** — Local package`,
    "",
    `This dependency resolves to ${source} (\`${spec}\`), not the npm registry, so there are no published stats to show.`,
  ].join("\n");
}

/**
 * Build the version detail lines for the hover popover. Renders three
 * pieces of information that frequently diverge — what the lockfile
 * installed, what the package.json range asks for, what the registry
 * currently publishes — and a footer explaining when one of those is
 * absent. Always shows at least `Latest version: X` when the registry
 * data is available.
 */
function buildVersionLines(
  stats: PackageStats,
  options: RenderHoverOptions,
): string[] {
  const lines: string[] = [];
  const declaredRange = options.declaredRange;
  const installed = options.installedVersion;
  const latest = stats.latestVersion;
  const isLockfileGrounded =
    !!installed && stats.versionResolution === "lockfile";

  if (isLockfileGrounded) {
    lines.push(`- **Installed:** ${installed}`);
    if (declaredRange && declaredRange !== installed) {
      lines.push(`- **Range:** ${declaredRange}`);
    }
    if (latest && latest !== installed) {
      lines.push(`- **Latest version:** ${latest}`);
    }
    return lines;
  }

  if (declaredRange) {
    lines.push(`- **Range:** ${declaredRange}`);
  }
  if (latest) {
    lines.push(`- **Latest version:** ${latest}`);
  }
  if (!installed && (declaredRange || latest)) {
    lines.push(`- _No lockfile found — showing latest._`);
  }
  return lines;
}

/**
 * Long-form byte formatter for hover text — picks Bytes / KB / MB / GB
 * with up to two decimals so sizes display cleanly inside markdown.
 */
function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 Bytes";
  }
  const units = ["Bytes", "KB", "MB", "GB"];
  const k = 1024;
  const tier = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(k)),
  );
  const value = bytes / Math.pow(k, tier);
  const decimals = tier === 0 ? 0 : 2;
  return `${parseFloat(value.toFixed(decimals))} ${units[tier]}`;
}

/**
 * Renders an ISO date as a relative time string ("3 weeks ago", "in
 * 2 days") via Intl.RelativeTimeFormat. Returns null on unparseable
 * input. The clock is injectable so tests can pin "now".
 */
function formatRelativeTime(
  isoDate: string,
  now: () => Date = () => new Date(),
): string | null {
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) {
    return null;
  }
  const deltaMs = now().getTime() - then.getTime();
  const deltaSeconds = Math.round(deltaMs / 1000);

  const units: {
    limit: number;
    divisor: number;
    unit: Intl.RelativeTimeFormatUnit;
  }[] = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 60 * 60, divisor: 60, unit: "minute" },
    { limit: 60 * 60 * 24, divisor: 60 * 60, unit: "hour" },
    { limit: 60 * 60 * 24 * 7, divisor: 60 * 60 * 24, unit: "day" },
    { limit: 60 * 60 * 24 * 30, divisor: 60 * 60 * 24 * 7, unit: "week" },
    { limit: 60 * 60 * 24 * 365, divisor: 60 * 60 * 24 * 30, unit: "month" },
    { limit: Infinity, divisor: 60 * 60 * 24 * 365, unit: "year" },
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const { limit, divisor, unit } of units) {
    if (Math.abs(deltaSeconds) < limit) {
      return formatter.format(-Math.round(deltaSeconds / divisor), unit);
    }
  }
  return null;
}
