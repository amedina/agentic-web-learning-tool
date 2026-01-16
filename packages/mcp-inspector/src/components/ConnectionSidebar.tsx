import { useState } from "react";
import {
  Button,
  Input,
  Dropdown as DropDown, // Exported as Dropdown, renaming to DropDown for internal consistency with my code
  type DropdownOption,
} from "@google-awlt/design-system";

export type TransportType = "websocket" | "sse";

interface ConnectionSidebarProps {
  onConnect: (transport: TransportType, url: string) => Promise<void>;
  onDisconnect: () => void;
  isConnected: boolean;
  connectionError?: string | null;
}

export function ConnectionSidebar({
  onConnect,
  onDisconnect,
  isConnected,
  connectionError,
}: ConnectionSidebarProps) {
  const [transport, setTransport] = useState<TransportType>("websocket");
  const [url, setUrl] = useState("ws://localhost:3000");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect(transport, url);
    } catch (error) {
      console.error("Connection failed", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const transportOptions: DropdownOption[] = [
    { id: "websocket", label: "WebSocket" },
    { id: "sse", label: "SSE" },
  ];

  return (
    <div className="w-1/3 h-full border-r bg-background flex flex-col p-4 gap-4">
      <h2 className="font-semibold mb-2">Connection</h2>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Transport</label>
        <DropDown
          options={transportOptions}
          selectedValue={transport}
          onSelect={(val: string) => setTransport(val as TransportType)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Server URL</label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://localhost:3000"
          disabled={isConnected}
        />
      </div>

      {connectionError && (
        <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
          {connectionError}
        </div>
      )}

      <div className="mt-auto">
        {!isConnected ? (
          <Button
            className="w-full"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="destructive"
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
