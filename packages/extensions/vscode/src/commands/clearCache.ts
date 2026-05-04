/**
 * Internal dependencies.
 */
import type { StatsCache } from "../cache/statsCache";

/**
 * External dependencies.
 */
import * as vscode from "vscode";

export const CLEAR_CACHE_COMMAND = "npmAdvisor.clearCache";

/**
 * Drops every cached PackageStats entry NPM Advisor has stored. Useful
 * after changing settings that affect cached payloads (e.g.
 * targetLicense) or when the user wants to force a fresh fetch.
 */
export function registerClearCacheCommand(
  cache: StatsCache,
): vscode.Disposable {
  return vscode.commands.registerCommand(CLEAR_CACHE_COMMAND, async () => {
    const removed = await cache.clearAll();
    const word = removed === 1 ? "package" : "packages";
    vscode.window.showInformationMessage(
      `NPM Advisor: cleared ${removed} cached ${word}.`,
    );
  });
}
