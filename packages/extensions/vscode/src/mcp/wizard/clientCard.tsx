/**
 * External dependencies.
 */
import { useEffect, useState, type FC } from "react";
import { ExternalLink, Info } from "lucide-react";

/**
 * Internal dependencies.
 */
import type {
  McpActionResult,
  McpClientView,
  McpWizardRequest,
} from "./protocol";
import { StatusBadge } from "./statusBadge";
import { ClientCardOverflow } from "./clientCardOverflow";
import { CliActions } from "./cliActions";
import { JsonMergeActions } from "./jsonMergeActions";
import { ActionToast } from "./actionToast";

/**
 * If a host action somehow never posts a result back (network / IPC
 * dropped, host extension crash, etc.), the card's pending spinner
 * would stick forever and disable every other button. This timeout
 * is a defensive escape hatch — long enough not to fire during
 * normal round-trips, short enough that a misbehaving handler is
 * recoverable without restarting VSCode.
 */
const PENDING_TIMEOUT_MS = 10_000;

interface ClientCardProps {
  client: McpClientView;
  lastResult: McpActionResult | undefined;
  dispatch: (message: McpWizardRequest) => void;
  onDismissResult: (clientId: string) => void;
}

/**
 * Renders one MCP client as a card: name, description, current status
 * badge, config-path hint, primary action button (Install / Reinstall
 * / Remove), and supporting actions (Open config, Reveal in
 * Finder/Explorer, Run in terminal, Copy command).
 *
 * The card is the single source of layout truth for both the
 * json-merge clients (Claude Desktop, Cursor, VSCode workspace) and
 * the cli-snippet client (Claude Code) — the latter swaps the primary
 * action for "Run in terminal" because no config file gets written
 * directly. Colors come from VSCode's CSS variables so the card
 * matches whatever theme the user has active.
 */
export const ClientCard: FC<ClientCardProps> = ({
  client,
  lastResult,
  dispatch,
  onDismissResult,
}) => {
  const [pending, setPending] = useState<McpWizardRequest["type"] | null>(null);

  useEffect(() => {
    if (lastResult) {
      setPending(null);
    }
  }, [lastResult]);

  // Defensive: clear pending after a bounded delay even if the host
  // never posts back. Keeps the card recoverable when something goes
  // wrong on the extension side; normal round-trips clear far sooner.
  useEffect(() => {
    if (!pending) {
      return;
    }
    const timeoutId = setTimeout(() => setPending(null), PENDING_TIMEOUT_MS);
    return () => clearTimeout(timeoutId);
  }, [pending]);

  const dispatchAction = (message: McpWizardRequest): void => {
    setPending(message.type);
    dispatch(message);
  };

  const status = client.status;
  const isCli = status.kind === "cli-snippet";
  const isInstalled =
    status.kind === "installed" || status.kind === "installed-stale";
  const configPath =
    status.kind === "installed" ||
    status.kind === "installed-stale" ||
    status.kind === "not-installed" ||
    status.kind === "no-config" ||
    status.kind === "error"
      ? status.configPath
      : null;
  const isWorkspaceBlocked = status.kind === "workspace-required";

  return (
    <div
      className="rounded-lg border"
      style={{
        backgroundColor: "var(--vscode-editorWidget-background)",
        borderColor: "var(--vscode-widget-border, var(--vscode-panel-border))",
      }}
    >
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold">{client.label}</h2>
              <StatusBadge status={status} />
            </div>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--vscode-descriptionForeground)" }}
            >
              {client.description}
            </p>
            {isCli ? (
              <p
                className="text-[11px] mt-2 leading-relaxed flex items-start gap-1.5"
                style={{ color: "var(--vscode-descriptionForeground)" }}
              >
                <Info size={12} className="shrink-0 mt-0.5" />
                <span>
                  Runs <code>claude mcp add</code> at local scope, so
                  npm-advisor is registered for the current project only — this
                  includes the Claude Code agent running inside VSCode.
                </span>
              </p>
            ) : null}
            {configPath ? (
              <p
                className="text-[11px] font-mono mt-2 break-all"
                style={{ color: "var(--vscode-descriptionForeground)" }}
                title={configPath}
              >
                {configPath}
              </p>
            ) : null}
            {isWorkspaceBlocked ? (
              <p
                className="text-[11px] mt-2 leading-relaxed"
                style={{ color: "var(--vscode-editorWarning-foreground)" }}
              >
                Open a workspace folder to use the VSCode workspace MCP file.
              </p>
            ) : null}
            {client.docsUrl ? (
              <a
                href={client.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] mt-2 hover:underline"
                style={{ color: "var(--vscode-textLink-foreground)" }}
              >
                <ExternalLink size={11} />
                Docs
              </a>
            ) : null}
          </div>
          <ClientCardOverflow
            client={client}
            pending={pending}
            isWorkspaceBlocked={isWorkspaceBlocked}
            dispatch={dispatchAction}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {isCli ? (
            <CliActions
              client={client}
              pending={pending}
              dispatch={dispatchAction}
            />
          ) : (
            <JsonMergeActions
              client={client}
              status={status}
              pending={pending}
              isInstalled={isInstalled}
              isWorkspaceBlocked={isWorkspaceBlocked}
              dispatch={dispatchAction}
            />
          )}
        </div>

        {lastResult ? (
          <ActionToast
            result={lastResult}
            onDismiss={() => onDismissResult(client.id)}
          />
        ) : null}
      </div>
    </div>
  );
};
