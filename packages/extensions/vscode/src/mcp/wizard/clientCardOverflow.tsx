/**
 * External dependencies.
 */
import { useEffect, useRef, useState, type FC } from "react";
import {
  Archive,
  Copy,
  FileCode,
  FolderOpen,
  List,
  MoreVertical,
  Trash2,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import type { McpClientView, McpWizardRequest } from "./protocol";
import { OverflowMenuItem, type OverflowItem } from "./overflowMenuItem";

interface ClientCardOverflowProps {
  client: McpClientView;
  pending: McpWizardRequest["type"] | null;
  isWorkspaceBlocked: boolean;
  dispatch: (message: McpWizardRequest) => void;
}

/**
 * Three-dots overflow menu in the card's top-right corner. For
 * json-merge clients it hosts the less-frequently-used file-system
 * actions (Open config, Reveal in OS) and the backup-management
 * actions (View / Delete backups); for the Claude Code (cli-snippet)
 * client it hosts the copy-command and "List MCP servers" actions
 * (see `buildCliItems`). Either way the primary action row stays tight.
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
export const ClientCardOverflow: FC<ClientCardOverflowProps> = ({
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
  const isCli = client.status.kind === "cli-snippet";

  const items: OverflowItem[] = isCli
    ? buildCliItems(client, close, dispatch)
    : [
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

/**
 * Builds the overflow-menu items for the Claude Code (cli-snippet)
 * card: copy the install / remove commands to the clipboard, plus a
 * "List MCP servers" shortcut that types `claude mcp list` into a
 * terminal. Each item is only included when the host resolved the
 * matching command string. These low-frequency actions live in the
 * menu so the card's action row keeps just the two "Run in terminal"
 * buttons.
 */
function buildCliItems(
  client: McpClientView,
  close: () => void,
  dispatch: (message: McpWizardRequest) => void,
): OverflowItem[] {
  const items: OverflowItem[] = [];
  if (client.cliCommand) {
    const installCommand = client.cliCommand;
    items.push({
      key: "copyInstall",
      label: "Copy install command",
      icon: <Copy size={14} />,
      onClick: () => {
        close();
        dispatch({
          type: "copyCommand",
          clientId: client.id,
          command: installCommand,
        });
      },
    });
  }
  if (client.cliRemoveCommand) {
    const removeCommand = client.cliRemoveCommand;
    items.push({
      key: "copyRemove",
      label: "Copy remove command",
      icon: <Copy size={14} />,
      onClick: () => {
        close();
        dispatch({
          type: "copyCommand",
          clientId: client.id,
          command: removeCommand,
        });
      },
    });
  }
  if (client.cliListCommand) {
    const listCommand = client.cliListCommand;
    items.push({
      key: "listServers",
      label: "List MCP servers",
      icon: <List size={14} />,
      onClick: () => {
        close();
        dispatch({
          type: "runCommand",
          clientId: client.id,
          command: listCommand,
          label: "List command",
        });
      },
    });
  }
  return items;
}
