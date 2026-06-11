/**
 * Internal dependencies.
 */
import { fetchWithCache } from "./fetchWithCache";

export type ReplacementType = "micro-utilities" | "native" | "preferred";

/**
 * Fetch one of the e18e replacement manifests (native, micro-utility,
 * or preferred-alternative) used by the Recommendations widget.
 *
 * @param type - Which manifest to fetch.
 * @param signal - Optional abort signal.
 */
export async function fetchModuleReplacements(
  type: ReplacementType,
  signal?: AbortSignal,
) {
  const url = `https://raw.githubusercontent.com/es-tooling/module-replacements/main/manifests/${type}.json`;
  return fetchWithCache(url, undefined, signal);
}
