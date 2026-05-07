/**
 * External dependencies.
 */
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  FileCode,
  FolderOpen,
  Info,
  Loader2,
  MoreVertical,
  RefreshCcw,
  Terminal,
  Trash2,
  X,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import type {
  McpActionResult,
  McpClientView,
  McpWizardRequest,
} from "./protocol";

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
          {isCli ? null : (
            <ClientCardOverflow
              client={client}
              pending={pending}
              isWorkspaceBlocked={isWorkspaceBlocked}
              dispatch={dispatchAction}
            />
          )}
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

interface ClientCardOverflowProps {
  client: McpClientView;
  pending: McpWizardRequest["type"] | null;
  isWorkspaceBlocked: boolean;
  dispatch: (message: McpWizardRequest) => void;
}

/**
 * Three-dots overflow menu in the card's top-right corner. Hosts the
 * less-frequently-used file-system actions (Open config, Reveal in
 * OS) and the backup-management actions (View / Delete backups) so
 * the primary action row stays tight.
 *
 * Click-outside / Escape close the menu. Disabled menu items render
 * dimmed but stay readable so users can see what's possible (e.g.
 * "View backups (0)" when there are no backups yet) instead of the
 * options disappearing into thin air.
 *
 * Delete backups uses a two-click confirm: the first click flips the
 * item's label to "Click again to confirm" and keeps the menu open
 * for a 4-second window; a second click in that window dispatches
 * the delete and closes the menu, anything else (timeout, click on a
 * different item, click-outside) resets the confirm state.
 */
const ClientCardOverflow: FC<ClientCardOverflowProps> = ({
  client,
  pending,
  isWorkspaceBlocked,
  dispatch,
}) => {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleMouseDown = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Closing the menu — for any reason — should reset the delete
  // confirm so a stray reopen doesn't fire a delete on first click.
  useEffect(() => {
    if (!open) {
      setConfirmingDelete(false);
    }
  }, [open]);

  // Auto-revert the confirm-pending state after 4 seconds so a
  // forgotten armed Delete doesn't sit there indefinitely.
  useEffect(() => {
    if (!confirmingDelete) {
      return;
    }
    const timeoutId = setTimeout(() => setConfirmingDelete(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [confirmingDelete]);

  const close = (): void => setOpen(false);
  const hasBackups = client.backupCount > 0;

  const items: OverflowItem[] = [
    {
      key: "openConfig",
      label: "Open config",
      icon: <FileCode size={14} />,
      disabled: isWorkspaceBlocked,
      onClick: () => {
        close();
        dispatch({ type: "openConfig", clientId: client.id });
      },
    },
    {
      key: "revealConfig",
      label: "Reveal in OS",
      icon: <FolderOpen size={14} />,
      disabled: isWorkspaceBlocked,
      onClick: () => {
        close();
        dispatch({ type: "revealConfig", clientId: client.id });
      },
    },
    {
      key: "viewBackups",
      label: `View backups (${client.backupCount})`,
      icon: <Archive size={14} />,
      disabled: !hasBackups,
      onClick: () => {
        close();
        dispatch({ type: "viewBackups", clientId: client.id });
      },
    },
    {
      key: "cleanupBackups",
      label: confirmingDelete ? "Click again to confirm" : "Delete backups",
      icon: <Trash2 size={14} />,
      disabled: !hasBackups,
      danger: true,
      onClick: () => {
        if (!confirmingDelete) {
          setConfirmingDelete(true);
          return;
        }
        setConfirmingDelete(false);
        close();
        dispatch({ type: "cleanupBackups", clientId: client.id });
      },
    },
  ];

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        disabled={pending !== null}
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        className="mcp-overflow-trigger"
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-10 min-w-[200px] rounded-md border py-1 shadow-md"
          style={{
            backgroundColor:
              "var(--vscode-menu-background, var(--vscode-editorWidget-background))",
            color: "var(--vscode-menu-foreground, var(--vscode-foreground))",
            borderColor:
              "var(--vscode-menu-border, var(--vscode-widget-border, var(--vscode-panel-border)))",
          }}
        >
          {items.map((item) => (
            <OverflowMenuItem key={item.key} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface OverflowItem {
  key: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}

interface OverflowMenuItemProps {
  item: OverflowItem;
}

/**
 * Single row inside `ClientCardOverflow`'s menu. Disabled items stay
 * visible (dimmed) so users see every option even when it's not
 * applicable yet — a "View backups (0)" tells the user backups
 * exist as a concept on this card, just not yet for them.
 */
const OverflowMenuItem: FC<OverflowMenuItemProps> = ({ item }) => (
  <button
    type="button"
    role="menuitem"
    disabled={item.disabled}
    onClick={item.onClick}
    className={`mcp-overflow-item ${item.danger ? "mcp-overflow-item-danger" : ""}`}
  >
    <span className="shrink-0">{item.icon}</span>
    <span className="flex-1 text-left">{item.label}</span>
  </button>
);

interface JsonMergeActionsProps {
  client: McpClientView;
  status: McpClientView["status"];
  pending: McpWizardRequest["type"] | null;
  isInstalled: boolean;
  isWorkspaceBlocked: boolean;
  dispatch: (message: McpWizardRequest) => void;
}

/**
 * Action row for the three json-merge clients. Only renders the
 * primary install / reinstall / remove buttons — every other action
 * (Open config, Reveal in OS, View / Delete backups) lives in the
 * three-dots overflow menu in the card header to keep the row tight.
 */
const JsonMergeActions: FC<JsonMergeActionsProps> = ({
  client,
  status,
  pending,
  isInstalled,
  isWorkspaceBlocked,
  dispatch,
}) => {
  const installLabel =
    status.kind === "installed-stale" ? "Reinstall" : "Install";
  const installIcon =
    status.kind === "installed-stale" ? (
      <RefreshCcw size={14} />
    ) : (
      <CheckCircle2 size={14} />
    );

  if (!isInstalled) {
    return (
      <PrimaryButton
        icon={installIcon}
        label={installLabel}
        loading={pending === "install"}
        disabled={pending !== null || isWorkspaceBlocked}
        onClick={() => dispatch({ type: "install", clientId: client.id })}
      />
    );
  }

  return (
    <>
      <SecondaryButton
        icon={<RefreshCcw size={14} />}
        label="Reinstall"
        loading={pending === "install"}
        disabled={pending !== null}
        onClick={() => dispatch({ type: "install", clientId: client.id })}
      />
      <DangerButton
        icon={<Trash2 size={14} />}
        label="Remove"
        loading={pending === "remove"}
        disabled={pending !== null}
        onClick={() => dispatch({ type: "remove", clientId: client.id })}
      />
    </>
  );
};

interface CliActionsProps {
  client: McpClientView;
  pending: McpWizardRequest["type"] | null;
  dispatch: (message: McpWizardRequest) => void;
}

/**
 * Action row for the Claude Code (cli-snippet) client. Run-in-terminal
 * is the primary path because we can do that for the user without a
 * round-trip to clipboard + paste; copy-to-clipboard stays as a
 * fallback for users who prefer running the CLI in a different
 * terminal app.
 */
const CliActions: FC<CliActionsProps> = ({ client, pending, dispatch }) => {
  if (!client.cliCommand || !client.cliRemoveCommand) {
    return null;
  }
  const installCommand = client.cliCommand;
  const removeCommand = client.cliRemoveCommand;
  return (
    <>
      <PrimaryButton
        icon={<Terminal size={14} />}
        label="Run install in terminal"
        loading={pending === "runCommand"}
        disabled={pending !== null}
        onClick={() =>
          dispatch({
            type: "runCommand",
            clientId: client.id,
            command: installCommand,
            label: "Install command",
          })
        }
      />
      <SecondaryButton
        icon={<Copy size={14} />}
        label="Copy install"
        loading={pending === "copyCommand"}
        disabled={pending !== null}
        onClick={() =>
          dispatch({
            type: "copyCommand",
            clientId: client.id,
            command: installCommand,
          })
        }
      />
      <SecondaryButton
        icon={<Terminal size={14} />}
        label="Run remove in terminal"
        loading={pending === "runCommand"}
        disabled={pending !== null}
        onClick={() =>
          dispatch({
            type: "runCommand",
            clientId: client.id,
            command: removeCommand,
            label: "Remove command",
          })
        }
      />
      <SecondaryButton
        icon={<Copy size={14} />}
        label="Copy remove"
        loading={pending === "copyCommand"}
        disabled={pending !== null}
        onClick={() =>
          dispatch({
            type: "copyCommand",
            clientId: client.id,
            command: removeCommand,
          })
        }
      />
    </>
  );
};

interface StatusBadgeProps {
  status: McpClientView["status"];
}

/**
 * Renders a colored pill summarizing the client's current state.
 * Color choice mirrors the diagnostics legend (green = good, amber =
 * action needed, slate = neutral, red = error) so the user's mental
 * model carries over from the side panel.
 */
const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  switch (status.kind) {
    case "installed":
      return (
        <Pill
          tone="success"
          icon={<CheckCircle2 size={12} />}
          label="Installed"
        />
      );
    case "installed-stale":
      return (
        <Pill
          tone="warning"
          icon={<RefreshCcw size={12} />}
          label="Stale path — reinstall"
        />
      );
    case "not-installed":
      return (
        <Pill tone="muted" icon={<Circle size={12} />} label="Not installed" />
      );
    case "no-config":
      return (
        <Pill tone="muted" icon={<Circle size={12} />} label="Not installed" />
      );
    case "workspace-required":
      return (
        <Pill
          tone="warning"
          icon={<AlertTriangle size={12} />}
          label="Workspace required"
        />
      );
    case "cli-snippet":
      return (
        <Pill tone="muted" icon={<Terminal size={12} />} label="CLI client" />
      );
    case "error":
      return (
        <Pill
          tone="danger"
          icon={<AlertTriangle size={12} />}
          label="Config error"
        />
      );
  }
};

interface PillProps {
  tone: "success" | "warning" | "muted" | "danger";
  icon: ReactNode;
  label: string;
}

/**
 * Tone-keyed pill style. Pulls foreground color from VSCode's editor
 * variables so the text reads correctly on any theme; the soft
 * background uses a `color-mix` against the same variable so it
 * tints automatically with the user's accent.
 */
const PILL_STYLES: Record<PillProps["tone"], CSSProperties> = {
  success: {
    color: "var(--vscode-charts-green, #16a34a)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-charts-green, #16a34a) 18%, transparent)",
  },
  warning: {
    color: "var(--vscode-editorWarning-foreground, #d97706)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-editorWarning-foreground, #d97706) 18%, transparent)",
  },
  muted: {
    color: "var(--vscode-descriptionForeground)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-foreground) 10%, transparent)",
  },
  danger: {
    color: "var(--vscode-editorError-foreground, #dc2626)",
    backgroundColor:
      "color-mix(in srgb, var(--vscode-editorError-foreground, #dc2626) 18%, transparent)",
  },
};

/** Tiny labelled badge used by `StatusBadge`. */
const Pill: FC<PillProps> = ({ tone, icon, label }) => (
  <span
    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
    style={PILL_STYLES[tone]}
  >
    {icon}
    {label}
  </span>
);

interface ButtonProps {
  icon: ReactNode;
  label: string;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const BUTTON_BASE =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Solid button used for the most prominent action on each card
 * (Install / Run in terminal). Uses VSCode's button-color variables
 * so it matches whatever accent / theme the user has active.
 */
const PrimaryButton: FC<ButtonProps> = ({
  icon,
  label,
  loading,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_BASE} mcp-button-primary`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {label}
  </button>
);

/**
 * Subtle bordered button for secondary actions on each card. Uses
 * VSCode's secondary-button variables, falling back to a neutral
 * border when the theme doesn't define them.
 */
const SecondaryButton: FC<ButtonProps> = ({
  icon,
  label,
  loading,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_BASE} mcp-button-secondary`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {label}
  </button>
);

/** Red-tinted button for destructive actions (Remove). */
const DangerButton: FC<ButtonProps> = ({
  icon,
  label,
  loading,
  disabled,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`${BUTTON_BASE} mcp-button-danger`}
  >
    {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
    {label}
  </button>
);

interface ActionToastProps {
  result: McpActionResult;
  onDismiss: () => void;
}

/**
 * Inline toast strip rendered at the bottom of a card. Keeps action
 * results scoped to the card that fired them — no global modals — so
 * the user can see "Installed for Cursor" while still reading the
 * Claude Desktop card above it.
 */
const ActionToast: FC<ActionToastProps> = ({ result, onDismiss }) => {
  const tone: PillProps["tone"] = !result.ok
    ? "danger"
    : result.nothingToDo
      ? "muted"
      : "success";
  const Icon = !result.ok
    ? AlertTriangle
    : result.nothingToDo
      ? Info
      : CheckCircle2;
  return (
    <div
      className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-xs"
      style={{
        ...PILL_STYLES[tone],
        borderColor: PILL_STYLES[tone].color as string,
      }}
    >
      <Icon size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed">{result.message}</div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
};
