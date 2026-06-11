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

## Create a publisher

Sign in at https://marketplace.visualstudio.com/manage with a Microsoft account
and create a publisher. The publisher id you choose there is what goes into
`package.json`, and it is **case-sensitive**.

## Set your publisher

Copy `.env.example` to `.env` (gitignored), set `VSCE_PUBLISHER` to your exact
publisher id, then:

```bash
pnpm --filter vscode-npm-advisor apply:identity
```

This writes the publisher into `package.json` (vsce has no `--publisher` flag).
You can also just edit `package.json` directly.

## Build, test locally, and upload

```bash
pnpm build:vscode

# optional: install the packaged .vsix locally to smoke-test first
code --install-extension dist/vscode-npm-advisor/vscode-npm-advisor-0.3.0.vsix
```

Then upload the `.vsix` from `dist/vscode-npm-advisor/` at
https://marketplace.visualstudio.com/manage. Use the "New extension > Visual
Studio Code" flow (a VS Code `.vsix` is not a "Visual Studio Extension"). The
listing goes live a few minutes after upload.

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
