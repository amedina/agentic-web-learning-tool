/**
 * External dependencies.
 */
import { type FC } from "react";
import { Terminal } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { McpClientView, McpWizardRequest } from "./protocol";
import { PrimaryButton } from "./primaryButton";
import { SecondaryButton } from "./secondaryButton";

interface CliActionsProps {
  client: McpClientView;
  pending: McpWizardRequest["type"] | null;
  dispatch: (message: McpWizardRequest) => void;
}

/**
 * Action row for the Claude Code (cli-snippet) client. Keeps just the
 * two run-in-terminal buttons because we can do that for the user
 * without a clipboard round-trip. The copy-command and "List MCP
 * servers" actions live in the card's three-dots overflow menu so the
 * row stays tight.
 */
export const CliActions: FC<CliActionsProps> = ({
  client,
  pending,
  dispatch,
}) => {
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
    </>
  );
};
