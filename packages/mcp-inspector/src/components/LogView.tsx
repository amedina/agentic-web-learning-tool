import { memo } from "react";
import { cn } from "@google-awlt/design-system";

export interface LogEntry {
  timestamp: number;
  type: "request" | "response" | "notification" | "error";
  direction: "inbound" | "outbound";
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

interface LogViewProps {
  logs: LogEntry[];
  className?: string;
}

export const LogView = memo(function LogView({
  logs,
  className,
}: LogViewProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full overflow-auto font-mono text-xs",
        className,
      )}
    >
      {logs.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No logs yet
        </div>
      ) : (
        logs.map((log, index) => (
          <div
            key={index}
            className={cn(
              "border-b p-2 flex gap-2",
              log.type === "error" && "bg-destructive/10 text-destructive",
              log.direction === "inbound" ? "bg-muted/30" : "bg-transparent",
            )}
          >
            <span className="text-muted-foreground w-20 shrink-0">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span
              className={cn(
                "font-bold w-24 shrink-0",
                log.direction === "outbound"
                  ? "text-blue-500"
                  : "text-green-500",
              )}
            >
              {log.direction.toUpperCase()}
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold">{log.method || log.type}</div>
              <pre className="whitespace-pre-wrap break-all text-muted-foreground mt-1">
                {JSON.stringify(log.params || log.result || log.error, null, 2)}
              </pre>
            </div>
          </div>
        ))
      )}
    </div>
  );
});
