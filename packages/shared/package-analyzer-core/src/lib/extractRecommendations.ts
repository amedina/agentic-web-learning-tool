/**
 * Extracts the list of replacement records for a package from a raw e18e
 * module-replacements feed. Returns `null` when the feed is missing, has no
 * mapping for the package, or resolves to no replacement records.
 */
export function extractRecommendations(raw: any, pkgName: string) {
  if (!raw || !raw.mappings || !raw.mappings[pkgName]) {
    return null;
  }
  const mapping = raw.mappings[pkgName];
  const replacementIds = mapping.replacements || [];

  const replacements = replacementIds
    .map((id: string) => raw.replacements?.[id])
    .filter(Boolean);

  return replacements.length > 0 ? replacements : null;
}
