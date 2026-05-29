/**
 * External dependencies.
 */
import { type FC } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  RefreshCcw,
  Terminal,
} from "lucide-react";

/**
 * Internal dependencies.
 */
import type { McpClientView } from "./protocol";
import { Pill } from "./pill";

interface StatusBadgeProps {
  status: McpClientView["status"];
}

/**
 * Renders a colored pill summarizing the client's current state.
 * Color choice mirrors the diagnostics legend (green = good, amber =
 * action needed, slate = neutral, red = error) so the user's mental
 * model carries over from the side panel.
 */
export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
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
