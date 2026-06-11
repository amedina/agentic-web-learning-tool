/**
 * External dependencies.
 */
import * as vscode from "vscode";

const CHANNEL_NAME = "NPM Advisor";

let channel: vscode.OutputChannel | undefined;

/**
 * Returns the shared "NPM Advisor" output channel, creating it on first
 * use. Surfaced in the Output panel so users (and us) can see what the
 * extension is doing when a UI surface gives no detail — e.g. a project
 * analysis that fails or times out.
 */
function getChannel(): vscode.OutputChannel {
  if (!channel) {
    channel = vscode.window.createOutputChannel(CHANNEL_NAME);
  }
  return channel;
}

/** Returns an ISO-ish `HH:MM:SS` timestamp prefix for a log line. */
function timestamp(): string {
  return new Date().toISOString().slice(11, 19);
}

/** Writes an informational line to the output channel. */
export function logInfo(message: string): void {
  getChannel().appendLine(`[${timestamp()}] ${message}`);
}

/**
 * Writes an error line to the output channel, appending the error's
 * message and stack when available so a failed run is debuggable from
 * the Output panel alone.
 */
export function logError(message: string, error?: unknown): void {
  const channel = getChannel();
  channel.appendLine(`[${timestamp()}] ERROR: ${message}`);
  if (error instanceof Error) {
    channel.appendLine(`  ${error.message}`);
    if (error.stack) {
      channel.appendLine(error.stack);
    }
  } else if (error !== undefined) {
    channel.appendLine(`  ${String(error)}`);
  }
}

/**
 * Disposes the output channel. Wired into the extension's disposables so
 * the channel is torn down on deactivation; the next `logInfo`/`logError`
 * would lazily recreate it.
 */
export function disposeLogger(): void {
  channel?.dispose();
  channel = undefined;
}
