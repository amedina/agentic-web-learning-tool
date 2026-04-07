# NPM Advisor

A Chrome extension that provides real-time package intelligence, security insights, dependency analysis, and AI-powered evaluation for npm packages — directly in your browser while you browse [npmjs.com](https://www.npmjs.com) and GitHub.

## Overview

NPM Advisor acts as a senior developer looking over your shoulder while you evaluate npm packages. It aggregates data from multiple sources (npm registry, GitHub, Bundlephobia, security advisories) into a single side panel, scores packages on objective metrics, and lets you chat with an AI advisor for deeper analysis.

## Features

### Package Analysis Dashboard

When you visit an npm package page or a `package.json` file on GitHub, NPM Advisor automatically fetches and displays:

- **Advisor Score** — A composite score (0–100) based on bundle size, dependency count, and availability of modern alternatives.
- **GitHub Metrics** — Stars, collaborator count, and last commit date to gauge community adoption and maintenance activity.
- **Issue Responsiveness** — Ratio of closed-to-total issues and total open issue count, indicating how actively maintainers respond to bug reports and feature requests.
- **Bundle Footprint** — Minified and gzipped sizes, tree-shakeability, and side-effects flags sourced from Bundlephobia.
- **Security Advisories** — Critical, high, moderate, and low severity advisories pulled from GitHub Security Advisories, with direct links to CVE details.
- **License Compatibility** — Checks the package's license against your project's target license (configurable, defaults to MIT) using the OSADL compatibility matrix.
- **Dependency Tree** — Interactive, recursive dependency visualization (up to depth 3) with two viewing modes:
  - **Tree View** — Expandable list with lazy-loaded children, version display, and circular dependency detection.
  - **Graph View** — Force-directed D3.js graph for visual exploration of the dependency structure.
- **Modern Alternatives** — Recommendations sourced from [es-tooling/module-replacements](https://github.com/nicolo-ribaudo/module-replacements), grouped into:
  - **Native APIs** — Built-in browser or Node.js APIs that can replace the package entirely.
  - **Micro-utilities** — Lightweight, focused alternatives.
  - **Preferred libraries** — Community-endorsed replacements with better maintenance or performance.

### Enhanced NPM Search

An Algolia-powered search overlay injected directly into npmjs.com replaces the native search with:

- Real-time results from the npm search index.
- Filter modes for **Author** and **Keyword** with visual chip tags.
- Debounced input (200ms) for responsive, non-blocking search.
- Toggleable from the Settings page.

### Package Comparison Tool

Compare multiple packages side-by-side from the Options page:

- Search and select packages via Algolia-powered multi-select.
- Batch-fetch stats with a visual progress bar.
- Comprehensive comparison table covering: Advisor Score, GitHub Stars, Collaborators, Last Commit, Bundle Size (minified/gzipped), Tree-shakeability, Side Effects, Dependency Count, Responsiveness, Security Advisories, and License Compatibility.
- Automatic winner determination with rationale.
- AI-powered comparative analysis via the integrated chatbot.

### AI-Powered Chat

An integrated chatbot available in both the side panel (single-package context) and the comparison view (multi-package context):

- Supports **Gemini**, **OpenAI**, and **Anthropic** models — bring your own API key.
- Context-aware system prompts that inject real package data for grounded, data-driven responses.
- Pre-built suggested prompts for common evaluation questions.
- Configurable per-provider: custom system prompts, thinking/reasoning mode toggles.
- Streaming responses for real-time feedback.

### Settings and Customization

- **AI Provider Management** — Configure API keys, enable/disable providers, set custom system prompts, and toggle thinking mode for reasoning-capable models.
- **Theme** — Light, dark, or system-auto mode.
- **Target License** — Set your project's license for compatibility checks.
- **Search Overlay** — Toggle the enhanced Algolia search on/off.
- **Factory Reset** — Clear all stored data and return to defaults.
- **Settings Export** — Download a JSON backup of your configuration.

## Architecture

NPM Advisor is a Chrome Manifest V3 extension with four main components:

```
┌─────────────────────────────────────────────────────┐
│                   Chrome Extension                  │
├──────────────┬──────────────┬────────────┬───────────┤
│  Background  │   Content    │   Side     │  Options  │
│  Service     │   Script     │   Panel    │  Page     │
│  Worker      │              │            │           │
├──────────────┼──────────────┼────────────┼───────────┤
│ • Message    │ • URL        │ • Package  │ • AI      │
│   routing    │   detection  │   dashboard│   provider│
│ • Stats      │ • Package    │ • Insights │   config  │
│   caching    │   extraction │   widgets  │ • Package │
│ • Algolia    │ • Search     │ • AI chat  │   compare │
│   search     │   overlay    │ • Theme    │ • Settings│
│   proxy      │   injection  │            │           │
└──────────────┴──────────────┴────────────┴───────────┘
```

**Data flow:**
1. User clicks the extension icon or navigates to an npm/GitHub page.
2. The content script extracts the package name and triggers a prefetch.
3. The background service worker orchestrates parallel API calls (npm registry, GitHub, Bundlephobia, module-replacements).
4. Results are cached in-memory and returned to the side panel.
5. The side panel renders the analysis dashboard with all widgets.
6. Users can add packages to the comparison bucket (persisted in `chrome.storage.local`) and open the Options page for side-by-side comparison.

## Tech Stack

| Layer | Technology |
|---|---|
| **UI Framework** | React 19, TypeScript |
| **Styling** | Tailwind CSS 4 |
| **AI Integration** | Vercel AI SDK, @assistant-ui/react |
| **AI Providers** | Google Gemini, OpenAI, Anthropic |
| **Search** | Algolia (npm search index) |
| **Visualization** | D3.js (force-directed graph), rc-tree |
| **Build** | Vite 7, vite-plugin-static-copy |
| **Testing** | Vitest |
| **Validation** | Zod |
| **Icons** | Lucide React |

## External APIs

| Service | Endpoint | Data Provided |
|---|---|---|
| npm Registry | `registry.npmjs.org` | Package metadata, versions, dependencies, license |
| GitHub API | `api.github.com` | Repository stats, issues, security advisories |
| ungh.cc | `ungh.cc/repos/...` | Cached GitHub repo data (rate-limit bypass) |
| Bundlephobia | `bundlephobia.com/api/size` | Bundle size, tree-shaking analysis |
| es-tooling | GitHub raw content | Native/preferred package replacement mappings |

## Permissions

| Permission | Purpose |
|---|---|
| `storage`, `unlimitedStorage` | Store settings, API keys, comparison selections, and cached data locally |
| `activeTab` | Detect navigation to npm/GitHub pages |
| `sidePanel` | Display the analysis dashboard in the browser side panel |
| `webNavigation` | Monitor page navigation to activate the extension on relevant pages |
| Host permissions (npm, GitHub, Bundlephobia) | Fetch package metadata, repo stats, security advisories, and bundle data |

## Development

### Prerequisites

- Node.js 20+
- pnpm (workspace package manager)

### Scripts

```bash
# Development build with watch mode
pnpm dev

# Production build
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint

# Run tests
pnpm test
```

### Loading the Extension

1. Run `pnpm build` from the package directory (or `pnpm dev` for watch mode).
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `dist/npm-advisor` directory at the repository root.

### Workspace Dependencies

This package depends on three sibling workspace packages:

- `@google-awlt/chatbot` — Shared chatbot UI components and runtime.
- `@google-awlt/common` — Shared utilities and types.
- `@google-awlt/design-system` — Shared UI component library.

## Privacy

NPM Advisor does not collect personal data, analytics, or telemetry. All settings and API keys are stored locally on your device via Chrome's storage APIs. Data is sent to third-party services only when required for core functionality (fetching package metadata, bundle stats, or AI responses). See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full details.

## License

This project is private and not published to npm.
