# Agentic Web Learning Tool

Instructions to run build and run this locally

## Prerequisites
- Git
- Node.js via nvm (the repo provides an `.nvmrc` with the required Node version)

## 1) Install nvm (Node Version Manager)
If you don't have nvm installed, follow the official instructions:
- Docs: https://github.com/nvm-sh/nvm#installing-and-updating
- Quick install (bash/zsh):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # restart your shell or source your profile, then:
  command -v nvm
  ```

## 2) Use the project Node version
From the repository root:
```bash
nvm install   # installs the version specified in .nvmrc
nvm use       # switches your shell to that version
```

## 3) Install pnpm (globally via npm)
This repo uses pnpm (required >= 10). Install it globally using npm:
```bash
npm install -g pnpm
pnpm -v
```

## 4) Install dependencies
From the repository root:
```bash
pnpm install
```

## 5) Build
From the repository root:
```bash
pnpm build
```
This runs the workspace build (currently targets the browser extension package).

## 6) Start development mode
From the repository root:
```bash
pnpm dev
```
This starts the extension build in watch mode and outputs artifacts under `dist/extension`.

## Notes
- To load the built browser extension for testing:
  - Chromium-based browsers: open `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select the `dist/extension` directory after a build/dev run.
