import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

export class StatelessHTTPClientTransport implements Transport {
  private _url: URL;
  private _headers: HeadersInit;

  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: (message: JSONRPCMessage) => void;

  constructor(url: URL, options?: { headers?: HeadersInit }) {
    this._url = url;
    this._headers = options?.headers ?? {};
  }

  async start(): Promise<void> {
    // Stateless transport, nothing to start
  }

  async close(): Promise<void> {
    // Stateless transport, nothing to close
    this.onclose?.();
  }

  async send(message: JSONRPCMessage): Promise<void> {
    try {
      const response = await fetch(this._url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this._headers,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      // Handle empty response bodies
      if (!text || text.trim() === '') {
        return;
      }

      let connectionMessage;
      try {
        connectionMessage = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON', e);
        throw e;
      }

      // Workaround for schema validation issues - strip tool.outputSchema
      if (connectionMessage.result?.tools) {
        connectionMessage.result.tools = connectionMessage.result.tools.map(
          (tool: any) => {
            if (tool.outputSchema) {
              delete tool.outputSchema;
            }
            return tool;
          }
        );
      }

      this.onmessage?.(connectionMessage);
    } catch (error) {
      console.error('Error in StatelessHTTPClientTransport send:', error);
      this.onerror?.(error as Error);
      throw error;
    }
  }
}
