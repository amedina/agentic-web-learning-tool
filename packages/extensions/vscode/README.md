# NPM Advisor for VSCode

Package intelligence, security insights, dependency analysis, and AI-powered evaluation for npm packages — directly inside VSCode.

This is the VSCode counterpart to the [NPM Advisor Chrome extension](../npm-advisor). Both share the analysis engine in [`@agentic-web-labs/package-analyzer-core`](../../shared/package-analyzer-core) and the UI primitives in [`@agentic-web-labs/package-analyzer-ui`](../../shared/package-analyzer-ui).

## Build

From the repository root:

```sh
pnpm build:vscode-npm-advisor
```

The packaged `.vsix` is written to `dist/vscode-npm-advisor/` at the repository root.

## Install the .vsix

```sh
code --install-extension dist/vscode-npm-advisor/vscode-npm-advisor-<version>.vsix
```

Or in VSCode: Extensions view → `…` menu → "Install from VSIX…".

## Develop

Open this directory in VSCode and press `F5` to launch the Extension Development Host.
