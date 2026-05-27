/**
 * External dependencies.
 */
import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import { ClientCard } from "./clientCard";
import type {
  McpActionResult,
  McpClientView,
  McpWizardMessage,
  McpWizardRequest,
} from "./protocol";

interface McpSetupAppProps {
  postMessage: (message: McpWizardRequest) => void;
}

interface InitState {
  clients: McpClientView[];
  iconUri: string;
}

/**
 * Wizard root. Listens for the host's `init` / `statuses` /
 * `actionResult` messages, fans them out per card, and exposes a
 * `dispatch` callback that wraps `postMessage` with the right typed
 * shape so each card stays decoupled from the postMessage plumbing.
 *
 * Color-wise the page picks up VSCode's editor theme via CSS
 * variables (--vscode-editor-background / --vscode-foreground /
 * --vscode-descriptionForeground) so the wizard blends with whatever
 * theme the user has active instead of carrying its own Tailwind
 * color palette.
 */
export const McpSetupApp: FC<McpSetupAppProps> = ({ postMessage }) => {
  const [state, setState] = useState<InitState | null>(null);
  const [resultsByClient, setResultsByClient] = useState<
    Record<string, McpActionResult | undefined>
  >({});
  // When false (default), the wizard hides clients that don't look
  // installed on this machine. Toggled on by the "Show all supported
  // clients" button so a user with an undetected install (portable
  // app, custom path) can still proceed.
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const handle = (event: MessageEvent): void => {
      const data = event.data as McpWizardMessage | undefined;
      if (!data || typeof data !== "object" || !("type" in data)) {
        return;
      }
      if (data.type === "init") {
        setState({ clients: data.clients, iconUri: data.iconUri });
        return;
      }
      if (data.type === "statuses") {
        setState((previous) =>
          previous ? { ...previous, clients: data.clients } : previous,
        );
        return;
      }
      if (data.type === "actionResult") {
        setResultsByClient((previous) => ({
          ...previous,
          [data.result.clientId]: data.result,
        }));
      }
    };
    window.addEventListener("message", handle);
    postMessage({ type: "ready" });
    return () => window.removeEventListener("message", handle);
  }, [postMessage]);

  const dispatch = useCallback(
    (message: McpWizardRequest) => {
      postMessage(message);
    },
    [postMessage],
  );

  const dismissResult = useCallback((clientId: string) => {
    setResultsByClient((previous) => {
      if (!previous[clientId]) {
        return previous;
      }
      const next = { ...previous };
      delete next[clientId];
      return next;
    });
  }, []);

  // Always-include rule: detected clients, plus any client we've
  // already installed against (so a stale-path entry is never hidden
  // behind the "Show all" toggle even if the app bundle has since
  // been removed).
  const visibleClients = useMemo(() => {
    if (!state) {
      return [];
    }
    if (showAll) {
      return state.clients;
    }
    return state.clients.filter((client) => {
      if (client.detected) {
        return true;
      }
      return (
        client.status.kind === "installed" ||
        client.status.kind === "installed-stale"
      );
    });
  }, [state, showAll]);

  const hiddenCount = state ? state.clients.length - visibleClients.length : 0;

  if (!state) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 p-12 text-sm h-screen"
        style={{
          backgroundColor: "var(--vscode-editor-background)",
          color: "var(--vscode-descriptionForeground)",
        }}
      >
        <Loader2 size={20} className="animate-spin" />
        <span>Loading MCP clients…</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--vscode-editor-background)",
        color: "var(--vscode-foreground)",
      }}
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        <header className="flex items-start gap-3 mb-6">
          <img
            src={state.iconUri}
            alt="NPM Advisor"
            width={40}
            height={40}
            className="shrink-0 mt-0.5 rounded-md"
          />
          <div>
            <h1 className="text-xl font-semibold leading-tight">
              Set up the npm-advisor MCP server
            </h1>
            <p
              className="text-sm mt-1 leading-relaxed"
              style={{ color: "var(--vscode-descriptionForeground)" }}
            >
              Register the bundled MCP server with each AI client where you want
              package-intelligence tools available. Each client is configured
              independently — install only what you use.
            </p>
          </div>
        </header>
        <ul className="space-y-3">
          {visibleClients.map((client) => (
            <li key={client.id}>
              <ClientCard
                client={client}
                lastResult={resultsByClient[client.id]}
                dispatch={dispatch}
                onDismissResult={dismissResult}
              />
            </li>
          ))}
        </ul>
        {(hiddenCount > 0 || showAll) && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((previous) => !previous)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors"
              style={{
                color: "var(--vscode-descriptionForeground)",
                borderColor: "var(--vscode-panel-border, transparent)",
                backgroundColor: "transparent",
              }}
            >
              {showAll ? (
                <>
                  <ChevronUp size={12} />
                  <span>Hide undetected clients</span>
                </>
              ) : (
                <>
                  <ChevronDown size={12} />
                  <span>Show all supported clients ({hiddenCount} hidden)</span>
                </>
              )}
            </button>
          </div>
        )}
        <footer
          className="mt-8 text-xs leading-relaxed"
          style={{ color: "var(--vscode-descriptionForeground)" }}
        >
          Existing config entries are preserved. The previous file is backed up
          alongside with a timestamped <code>.bak</code> suffix on every install
          or remove.
        </footer>
      </div>
    </div>
  );
};
