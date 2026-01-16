import { memo, useCallback } from "react";
import type { Resource } from "@modelcontextprotocol/sdk/types.js";
import { Button, cn } from "@google-awlt/design-system";
import { FileIcon, RefreshCw } from "lucide-react";

interface ResourceViewProps {
  resources: Resource[];
  onRefresh?: () => void;
  onReadResource?: (uri: string) => void;
  className?: string;
}

export const ResourceView = memo(function ResourceView({
  resources,
  onRefresh,
  onReadResource,
  className,
}: ResourceViewProps) {
  const handleRead = useCallback(
    (uri: string) => {
      onReadResource?.(uri);
    },
    [onReadResource],
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Resources</h3>
        {onRefresh && (
          <Button variant="ghost" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {resources.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No resources found
          </div>
        ) : (
          resources.map((resource) => (
            <div
              key={resource.uri}
              className="border rounded-lg p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
            >
              <FileIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{resource.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {resource.uri}
                </div>
                {resource.mimeType && (
                  <div className="text-xs text-muted-foreground mt-1 badge badge-outline">
                    {resource.mimeType}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRead(resource.uri)}
              >
                Read
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
