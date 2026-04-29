/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

export type ReplacementType = "micro-utilities" | "native" | "preferred";

/**
 * Fetch Module Replacements.
 */
export async function fetchModuleReplacements(type: ReplacementType) {
  const url = `https://raw.githubusercontent.com/es-tooling/module-replacements/main/manifests/${type}.json`;
  return fetchWithCache(url);
}
