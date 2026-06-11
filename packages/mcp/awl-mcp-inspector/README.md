# AWL MCP Inspector (`@agentic-web-labs/awl-mcp-inspector`)

> Embeddable React UI library for inspecting, debugging, and interacting with MCP servers.

## Overview

`awl-mcp-inspector` is a React UI **library** — not a CLI tool or standalone server — for inspecting MCP (Model Context Protocol) servers. It exposes a fully self-contained tab component (`MCPInspectorTab`) that lets users browse resources, prompts, and tools; send ping requests; manage OAuth 2.0 / bearer-token authentication; and review sampling/elicitation requests. Despite living under `packages/mcp/`, its role is purely as a UI library: consuming apps supply a pre-built `Client` and `Transport`, wrap them in `McpConnectionProvider`, and embed the `MCPInspectorTab` component wherever needed.

## Usage in the monorepo

Add it as a workspace dependency:

```json
"@agentic-web-labs/awl-mcp-inspector": "workspace:*"
```

Then import from the package:

```ts
import { McpConnectionProvider, MCPInspectorTab } from "@agentic-web-labs/awl-mcp-inspector";
```

## API / Exports

| Export | Kind | Purpose |
|---|---|---|
| `MCPInspectorTab` | React component | Full inspector UI tab |
| `McpConnectionProvider` | React provider | Wraps children with MCP connection state; accepts `client: Client \| null` and `transport: Transport \| null` |
| `useMCPClientProvider` | Hook | Selector-based accessor to `McpConnectionContextType` |
| `InspectorOAuthClientProvider` | Class | Implements `OAuthClientProvider`; persists tokens/code-verifier/client-info to `sessionStorage` |
| `McpConnectionContext` | React context | Raw context object for advanced consumers |

## Example

```tsx
import { McpConnectionProvider, MCPInspectorTab } from "@agentic-web-labs/awl-mcp-inspector";
import { Client } from "@modelcontextprotocol/sdk/client";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp";

const client = new Client({ name: "my-app", version: "1.0.0" });
const transport = new StreamableHTTPClientTransport(new URL("http://localhost:3000/mcp"));

<McpConnectionProvider client={client} transport={transport}>
  <MCPInspectorTab />
</McpConnectionProvider>
```

## Scripts

| Script | What it does |
|---|---|
| `build` | `tsc` — compiles to `dist/` |
| `dev` | `tsc --watch` |
| `test` | `jest --config jest.config.cjs` (JSDOM + RTL) |
| `check-types` | `tsc --noEmit` |
| `lint` | `eslint src` |

## Dependencies

- Internal: `@agentic-web-labs/common` (`workspace:*`), `@agentic-web-labs/design-system` (peer, `workspace:*`)
- Key external: `@modelcontextprotocol/sdk ^1.25.2`, `react ^19.0.0` / `react-dom`, `zod ^4.3.5`, `ajv 6.15.0`, `prismjs`, `cmdk`

## Related packages

- [`@agentic-web-labs/common`](../../shared/common/README.md)
- [`@agentic-web-labs/design-system`](../../shared/design-system/README.md)
