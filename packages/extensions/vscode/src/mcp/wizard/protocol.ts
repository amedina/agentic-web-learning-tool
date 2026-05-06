/**
 * Internal dependencies.
 */
import type { McpClientId } from "../clientConfigs";
import type { McpClientStatus } from "../operations";

/**
 * Per-client snapshot rendered as a card in the wizard. Built by the
 * host on each refresh and pushed to the webview as part of the init /
 * statuses message. `cliCommand` / `cliRemoveCommand` only set for
 * Claude Code (cli-snippet strategy).
 */
export interface McpClientView {
  id: McpClientId;
  label: string;
  description: string;
  docsUrl?: string;
  status: McpClientStatus;
  cliCommand?: string;
  cliRemoveCommand?: string;
}

/**
 * Inline result the host posts back per action so the card can show a
 * toast strip ("Installed", "Nothing to remove", etc.) without a
 * global modal. `clientId` is the routing key on the webview side.
 */
export interface McpActionResult {
  clientId: McpClientId;
  /** Which action the result is for — keeps the card's UI honest. */
  action: "install" | "remove" | "openConfig" | "revealConfig" | "runCommand";
  ok: boolean;
  message: string;
  /** True for install/remove no-ops (e.g. "nothing to remove"). */
  nothingToDo?: boolean;
}

/**
 * Webview → host messages.
 * - `ready`: handshake; host flushes init payload after this fires.
 * - `install` / `remove`: per-client primary actions; host re-runs the
 *   status detector and posts a `statuses` update plus an
 *   `actionResult` so the card can render its inline state.
 * - `openConfig` / `revealConfig`: host opens the JSON config file in
 *   the editor / OS file manager respectively.
 * - `runCommand`: opens an integrated terminal and pre-types the given
 *   command (does not auto-execute). Used for Claude Code's CLI flow
 *   so the user can review before pressing Enter.
 * - `copyCommand`: writes a string to the system clipboard.
 */
export type McpWizardRequest =
  | { type: "ready" }
  | { type: "install"; clientId: McpClientId }
  | { type: "remove"; clientId: McpClientId }
  | { type: "openConfig"; clientId: McpClientId }
  | { type: "revealConfig"; clientId: McpClientId }
  | {
      type: "runCommand";
      clientId: McpClientId;
      command: string;
      label: string;
    }
  | { type: "copyCommand"; clientId: McpClientId; command: string };

/**
 * Host → webview messages.
 * - `init`: full snapshot of every client + the resolved NPM Advisor
 *   icon URI (the host webview-rewrites it through `asWebviewUri` so
 *   the strict CSP allows it). Sent on ready and on every refresh.
 * - `statuses`: cheap re-push of just the status snapshots after an
 *   action runs, so the card flips between "Installed" / "Not
 *   installed" without resending labels / docs URLs.
 * - `actionResult`: inline toast routed to a single card by clientId.
 */
export type McpWizardMessage =
  | { type: "init"; clients: McpClientView[]; iconUri: string }
  | { type: "statuses"; clients: McpClientView[] }
  | { type: "actionResult"; result: McpActionResult };
