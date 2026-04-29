/**
 * Calculate Score.
 */
export const calculateScore = (pkg: any) => {
  if (pkg.score !== undefined && pkg.score !== null) return pkg.score;
  let score = 0;
  const gzip = pkg.bundle?.gzip || Infinity;
  if (gzip < 50000) score += 10;
  if (gzip < 10000) score += 20;

  const deps = pkg.dependencyTree
    ? Object.keys(pkg.dependencyTree.dependencies || {}).length
    : 0;
  if (deps === 0) score += 30;
  else if (deps < 5) score += 15;

  const recs = pkg.recommendations;
  if (
    recs &&
    (recs.nativeReplacements?.length > 0 ||
      recs.preferredReplacements?.length > 0)
  ) {
    score += 25;
  }
  return score;
};
