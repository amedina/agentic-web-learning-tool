/**
 * External dependencies.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { startHttpServer, type RunningHttpServer } from "../httpTransport";

const INITIALIZE_BODY = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    clientInfo: { name: "vitest", version: "0.0.0" },
    capabilities: {},
  },
};

const NON_INITIALIZE_BODY = {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/list",
  params: {},
};

describe("startHttpServer", () => {
  let server: RunningHttpServer | undefined;
  let baseUrl: string;

  afterEach(async () => {
    if (server) {
      await server.close();
      server = undefined;
    }
  });

  describe("without auth token", () => {
    beforeEach(async () => {
      server = await startHttpServer({ host: "127.0.0.1", port: 0 });
      baseUrl = `http://127.0.0.1:${server.port}`;
    });

    it("returns 404 for non-MCP paths", async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(404);
    });

    it("returns 405 for unsupported methods on /mcp", async () => {
      const response = await fetch(`${baseUrl}/mcp`, { method: "PUT" });
      expect(response.status).toBe(405);
      expect(response.headers.get("allow")).toBe("GET, POST, DELETE");
    });

    it("rejects a POST without session id when body is not initialize", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(NON_INITIALIZE_BODY),
      });
      expect(response.status).toBe(400);
      const payload = await response.json();
      expect(payload.error.message).toMatch(/initialize/);
    });

    it("rejects GET without an mcp-session-id", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "GET",
        headers: { accept: "text/event-stream" },
      });
      expect(response.status).toBe(400);
    });

    it("returns 404 for POSTs that carry an unknown session id", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-session-id": "does-not-exist",
        },
        body: JSON.stringify(NON_INITIALIZE_BODY),
      });
      expect(response.status).toBe(404);
    });

    it("accepts an initialize POST and returns an mcp-session-id header", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(INITIALIZE_BODY),
      });
      expect(response.status).toBe(200);
      const sessionId = response.headers.get("mcp-session-id");
      expect(sessionId).toBeTruthy();
      // Drain the SSE body so the server can finish the response cleanly.
      await response.body?.cancel();
    });
  });

  describe("with auth token", () => {
    beforeEach(async () => {
      server = await startHttpServer({
        host: "127.0.0.1",
        port: 0,
        authToken: "secret-token",
      });
      baseUrl = `http://127.0.0.1:${server.port}`;
    });

    it("returns 401 when no bearer token is presented", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(INITIALIZE_BODY),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get("www-authenticate")).toMatch(/Bearer/);
    });

    it("returns 401 when the bearer token does not match", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: "Bearer wrong-token",
        },
        body: JSON.stringify(INITIALIZE_BODY),
      });
      expect(response.status).toBe(401);
    });

    it("accepts requests carrying the correct bearer token", async () => {
      const response = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          authorization: "Bearer secret-token",
        },
        body: JSON.stringify(INITIALIZE_BODY),
      });
      expect(response.status).toBe(200);
      expect(response.headers.get("mcp-session-id")).toBeTruthy();
      await response.body?.cancel();
    });
  });
});
