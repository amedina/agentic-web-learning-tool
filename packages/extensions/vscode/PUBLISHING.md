# Publishing NPM Advisor to the VS Code Marketplace

This guide covers packaging and publishing the `vscode-npm-advisor` extension.
The owner publishes under their own Marketplace publisher; nothing here is
specific to one machine.

## Identity

The published id is `publisher.name`:

| Field         | Value               |
| ------------- | ------------------- |
| `name`        | `vscode-npm-advisor`|
| `displayName` | `NPM Advisor`       |
| `publisher`   | your publisher id   |

The committed `publisher` is `agentic-web-labs`. Set it to your own publisher id
before publishing if you publish under a different account (see "Set your
publisher" below). The id is **case-sensitive**.

## Why you cannot run bare `vsce package`

This is a pnpm monorepo, and the extension declares `workspace:*` dependencies.
`vsce` walks the dependency tree by default and chokes on `workspace:*` (not a
valid semver) and pnpm's symlinked `node_modules`. The build already solves
this: esbuild bundles everything into `dist/`, and the production build runs
`vsce package --no-dependencies`. Always build through the project script:

```bash
pnpm install        # once
pnpm build:vscode   # bundles + packages the .vsix
```

The `.vsix` lands in `dist/vscode-npm-advisor/` as `vscode-npm-advisor-<version>.vsix`.

## One-time account setup

1. Sign in to Azure DevOps (https://dev.azure.com) and create an organization.
2. Create a Personal Access Token (PAT):
   - User settings > Personal access tokens > New token.
   - Organization: "All accessible organizations".
   - Scopes: "Marketplace > Manage".
   - Copy the token now (shown only once).
3. Create your publisher at https://marketplace.visualstudio.com/manage. The
   publisher id you choose there is what goes into `package.json`.

## Set your publisher

Copy `.env.example` to `.env` (gitignored), set `VSCE_PUBLISHER` to your exact
publisher id, then:

```bash
pnpm --filter vscode-npm-advisor apply:identity
```

This writes the publisher into `package.json` (vsce has no `--publisher` flag).
You can also just edit `package.json` directly.

## Build, test locally, publish

```bash
pnpm build:vscode

# install the packaged .vsix locally to smoke-test before publishing
code --install-extension dist/vscode-npm-advisor/vscode-npm-advisor-0.3.0.vsix

# publish from the CLI (recommended; clear error messages)
cd packages/extensions/vscode
npx vsce publish -p "$VSCE_PAT" --no-dependencies \
  --packagePath ../../../dist/vscode-npm-advisor/vscode-npm-advisor-0.3.0.vsix
```

Or upload the `.vsix` at https://marketplace.visualstudio.com/manage. To remove
a listing: `npx vsce unpublish <publisher>.vscode-npm-advisor`.

## Troubleshooting

### "Value cannot be null. Parameter name: v1" on the web upload

The web uploader throws this useless message for several unrelated reasons.
In order of likelihood:

1. **Wrong upload type.** A VS Code `.vsix` must be uploaded as a "Visual Studio
   Code Extension", NOT a "Visual Studio Extension". The "New Visual Studio
   Extension" flow rejects a VS Code package with this error. Use the VS Code
   extension upload flow.
2. **Publisher id casing.** The `publisher` in the manifest must match your
   registered publisher id exactly; the lookup is case-sensitive. The manage
   page URL may show it lowercased even when the real id is mixed-case.
3. **Browser extension interference.** A browser extension that injects content
   scripts and hooks `fetch`/`FormData` (for example a WebMCP or AWL extension)
   can corrupt the multipart upload so the server receives a null payload. Retry
   in an Incognito window with extensions disabled, or publish from the CLI,
   which bypasses the browser entirely.
4. **Stuck draft.** Delete any half-created draft of the same extension on the
   manage page before retrying.

The `vsce` CLI reports all of these with clear messages, so prefer it when the
web uploader misbehaves.

## Known limitation: migration wizard in a packaged build

The migration wizard depends on `module-replacements-codemods`, which
transitively loads `@ast-grep/napi`, a Rust-backed library shipping
platform-specific native bindings (`.node` files). esbuild cannot bundle those,
so `esbuild.config.js` marks them external, and `vsce package --no-dependencies`
strips `node_modules` from the `.vsix`. In a Marketplace build the wizard
surfaces a friendly "could not load" error; everything else (hover, diagnostics,
side panel, project analysis, project health, chat, MCP) works.

Shipping the wizard cross-platform requires VS Code's platform-specific
extension publishing (one `.vsix` per `--target`). Tracked as a follow-up.

## Workspace Trust and virtual workspaces

`package.json` declares `capabilities.untrustedWorkspaces.supported: false` and
`capabilities.virtualWorkspaces.supported: false`. The extension reads files,
runs dependency/security analysis, and can apply a codemod that rewrites files,
so it requires a trusted, on-disk workspace. This is the recommended posture for
code-executing extensions.
