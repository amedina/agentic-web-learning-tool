# Chatbot (`@agentic-web-labs/chatbot`)

> Reusable React chatbot UI with multi-provider AI, MCP tool calling, and Chrome extension side-panel integration.

## Overview

This package provides a self-contained, embeddable chat UI for Chrome extension side panels. It wires together the `@assistant-ui/react` thread/runtime system with the Vercel AI SDK (`ai` v5), supporting three cloud LLM providers (Anthropic, OpenAI, Gemini) plus an on-device Chrome Prompt API (Gemini Nano) transport. MCP tool calling is integrated via `@mcp-b/react-webmcp` and `@mcp-b/transports`, and the package is tightly coupled to the Chrome extension environment — using `chrome.storage` for chat history persistence, `chrome.tabs` for injected tab context, and `chrome.runtime` for side-panel lifecycle.

## Usage in the monorepo

Add as a `workspace:*` dependency in any consuming package's `package.json`:

```json
"dependencies": {
  "@agentic-web-labs/chatbot": "workspace:*"
}
```

Import from the package name; the `exports` field points directly to `./src/index.ts` (source, not `dist/`), making it suited to TypeScript workspace consumers:

```ts
import { SidepanelChatbot, PropProvider } from '@agentic-web-labs/chatbot';
```

## API / Exports

| Export | Kind | Description |
|---|---|---|
| `SidepanelChatbot` | Component | Top-level component; wraps `ModelProvider` + `TabThreadInformationProvider` + the tabbed `SidePanel` |
| `PropProvider` | Component | Injects host-controlled props (tabs, footer, custom renderers, tool-calling flag, system prompt override, export callback) |
| `usePropProvider` | Hook | Reads the `PropProvider` context |
| `PropProviderContext` | Context | React context object for `PropProvider` |
| `transportGenerator` | Factory fn | Returns a `GeminiNanoChatTransport` or `CloudHostedTransport` for a given provider/model/API-key config |
| `useAssistantMCP` | Hook | Bridges MCP tool list + MCP client to the `@assistant-ui/react` runtime |
| `INITIAL_PROVIDERS` | Constant | Default provider configuration |
| `BUILT_IN_COMMANDS` | Constant | Built-in slash commands |
| `ToolNameMap` | Constant | Maps internal tool names |
| `CONNECTION_NAMES` | Constant | MCP connection name registry |
| `EXPORT_JSON_VERSION` | Constant | Version string for chat export format |
| `buildProviderOptions`, `cleanArguments`, `formatToolResult`, `jsonSchemaToZod`, `mcpToolToJSONSchema`, `mergeSystemAndMessages`, `convertMessages`, `getProviderErrorMessage`, `surfaceTransportError`, `openOptionsPage`, `getToolNameForUI`, `toolCallParser` | Utilities | Various helpers for tool calls, message conversion, error handling |
| `ToolCallRequest`, `ToolCall`, `APIKeys`, `SidePanelTabProps`, `AgentType`, `ChatDataType`, `RemoteThreadMetadata` | Types | Core TypeScript types |

## Example

```tsx
import { PropProvider, SidepanelChatbot } from '@agentic-web-labs/chatbot';

export default function App() {
  return (
    <PropProvider allowToolCalling footerNode={<MyFooter />}>
      <SidepanelChatbot />
    </PropProvider>
  );
}
```

## Scripts

| Script | Command |
|---|---|
| `build` | `tsc` |
| `dev` | `tsc --watch` |
| `test` | Jest (jsdom, `--passWithNoTests`) |
| `check-types` | `tsc --noEmit` |
| `lint` / `lint:fix` | ESLint |
| `format` | Prettier |

## Dependencies

- Internal:
  - `@agentic-web-labs/common` (`workspace:*`) — logger, `MCPServerConfig` type
  - `@agentic-web-labs/design-system` (`workspace:*`) — `Tabs`, `PromptCommand` type, UI primitives
  - `@agentic-web-labs/shared-config` (`workspace:*`, dev) — dev/build config

- Key external:
  - `@assistant-ui/react` — Thread/runtime/message UI framework
  - `@assistant-ui/react-ai-sdk` — `useChatRuntime` bridging AI SDK to assistant-ui
  - `ai` ^5.0.104 (Vercel AI SDK) — `streamText`, `convertToModelMessages`, `createUIMessageStream`
  - `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` — Provider adapters
  - `@mcp-b/react-webmcp`, `@mcp-b/transports` — MCP in browser + `ExtensionClientTransport`
  - `@modelcontextprotocol/sdk` — MCP `Client` type
  - `react` ^19.1.1, `zod` 4.1.13, `lucide-react`, `@radix-ui/react-icons`

## Related packages

- [common](../common/README.md)
- [design-system](../design-system/README.md)
- [shared-config](../shared-config/README.md)
