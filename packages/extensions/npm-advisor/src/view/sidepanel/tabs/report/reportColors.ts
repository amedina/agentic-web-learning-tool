/**
 * Canonical colors for the Report tab.
 *
 * Each metric and dependency category has a single dedicated color used
 * everywhere it appears (pie segments, matrix swatches, accordion badges,
 * etc.) so the user can recognise a parameter at a glance.
 *
 * Document and reuse — do not invent new colors per surface.
 *
 * | Token             | Color                     | Used for                   |
 * | ----------------- | ------------------------- | -------------------------- |
 * | prod              | rgb(76, 121, 244)         | dependencies (production)  |
 * | dev               | rgb(34, 197, 94)          | devDependencies            |
 * | peer              | rgb(168, 85, 247)         | peerDependencies           |
 * | vulnerable        | rgb(236, 113, 89)         | packages with advisories   |
 * | licenseIssue      | rgb(243, 174, 78)         | license incompatibilities  |
 * | replaceable       | rgb(139, 92, 246)         | e18e replacement available |
 * | unanalysed        | rgb(148, 163, 184)        | not on npm / fetch failed  |
 * | neutral           | rgb(226, 232, 240)        | empty pie remainder        |
 */
export const REPORT_COLORS = {
  prod: "#4C79F4",
  dev: "#22C55E",
  peer: "#A855F7",
  vulnerable: "#EC7159",
  licenseIssue: "#F3AE4E",
  replaceable: "#8B5CF6",
  unanalysed: "#94A3B8",
  neutral: "#E2E8F0",
} as const;

/**
 * The "Total Dependencies" matrix swatch can take one of three colors
 * depending on which dependency category is largest. Returns the canonical
 * color for the dominant category — `prod` wins ties because production
 * deps are the most consequential signal in a frontend project.
 */
export function dominantDependencyColor(counts: {
  prod: number;
  dev: number;
  peer: number;
}): string {
  const { prod, dev, peer } = counts;
  if (peer > prod && peer > dev) {
    return REPORT_COLORS.peer;
  }
  if (dev > prod && dev > peer) {
    return REPORT_COLORS.dev;
  }
  return REPORT_COLORS.prod;
}
