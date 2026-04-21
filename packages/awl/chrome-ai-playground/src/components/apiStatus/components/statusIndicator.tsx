/**
 * External dependencies
 */
import { Circle, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@google-awlt/design-system";

export type StatusType = "ready" | "warning" | "error" | "loading" | "info";

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export default function StatusIndicator({
  status,
  label,
  className,
}: StatusIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case "ready":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "loading":
        return <Circle className="w-4 h-4 text-blue-500 animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getLabelColor = () => {
    switch (status) {
      case "ready":
        return "text-green-700 dark:text-green-400";
      case "warning":
        return "text-yellow-700 dark:text-yellow-400";
      case "error":
        return "text-red-700 dark:text-red-400";
      case "loading":
        return "text-blue-700 dark:text-blue-400";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {getIcon()}
      {label && (
        <span className={cn("text-sm font-medium", getLabelColor())}>
          {label}
        </span>
      )}
    </div>
  );
}
