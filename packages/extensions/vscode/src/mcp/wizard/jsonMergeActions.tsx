/**
 * External dependencies.
 */
import { type FC } from "react";
import { CheckCircle2, RefreshCcw, Trash2 } from "lucide-react";

/**
 * Internal dependencies.
 */
import type { McpClientView, McpWizardRequest } from "./protocol";
import { PrimaryButton } from "./primaryButton";
import { SecondaryButton } from "./secondaryButton";
import { DangerButton } from "./dangerButton";

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
export const JsonMergeActions: FC<JsonMergeActionsProps> = ({
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
