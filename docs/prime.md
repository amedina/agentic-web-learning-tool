# NPM Advisor Chrome Extension — Understanding

## Context
This document summarizes the architecture and capabilities of the `packages/npm-advisor` Chrome extension, which provides npm package analytics and AI-powered recommendations inline while browsing npmjs.com or GitHub package.json files.

---

## Purpose
A Chrome extension that analyzes npm packages across multiple dimensions — bundle size, security advisories, license compatibility, GitHub health metrics, dependency tree — and surfaces AI-powered chat for comparison and recommendations.

---

## Architecture

### Extension Entry Points
| Component | File | Role |
|---|---|---|
| Content Script | `src/contentScript/contentScript.ts` | Detects package on page load, triggers prefetch |
| Background Worker | `src/background/background.ts` | Caches stats, handles messages from popup/content script |
| Popup | `src/view/popup/popup.tsx` | Two-tab UI: Insights + Ask AI |
| Options Page | `src/view/options/options.tsx` | API key settings + multi-package comparison |

### Communication Flow
```
User visits npmjs.com/package/X or GitHub package.json
→ Content script detects package name
→ Sends PREFETCH to background
→ Background fetches all stats and caches in memory

User opens popup
→ Popup sends GET_STATS to background
→ Background returns cached data
→ Popup renders widgets
```

---

## Data Sources

| Source | What it provides |
|---|---|
| `registry.npmjs.org` | Metadata, versions, license, dependencies, maintainers |
| `ungh.cc/repos/{owner}/{repo}` | Stars, last push date, collaborator count (GitHub proxy) |
| `api.github.com/search/issues` | Open/closed issue ratio → responsiveness score |
| `api.github.com/repos/.../security-advisories` | CVE severity counts |
| `bundlephobia.com/api/size` | Bundle size, tree-shakeable, side-effects flag |
| `raw.githubusercontent.com/es-tooling/module-replacements` | Alternative package suggestions |
| Local JSON | OSADL license compatibility matrix |

---

## UI Components (Popup Widgets)
- **Header** — package name, score badge, stars
- **BundleFootprint** — minified/gzipped sizes
- **SecurityAdvisories** — critical/high/moderate/low CVEs
- **Responsiveness** — issue response rate classification
- **LicenseCheck** — compatibility against user's target license
- **Recommendations** — alternative packages from module-replacements
- **DependencyTree** — recursive tree (max depth 3, using `rc-tree`)

---

## AI Integration
- **Providers:** Google Gemini (`@ai-sdk/google`) and OpenAI GPT-4o (`@ai-sdk/openai`)
- **Framework:** Vercel AI SDK with `@assistant-ui/react` for chat UI
- **System prompt:** Injected with full package stats JSON
- **Features:** Streaming, thinking mode (Gemini thinkingBudget=8192, OpenAI reasoningEffort=medium)
- **Storage:** Per-tab message history in `chrome.storage.local`

---

## Score Algorithm
Points awarded:
- Bundle < 50KB: +10, < 10KB: +20
- Zero deps: +30, 1–4 deps: +15
- Native/preferred replacements exist: +25

---

## Storage Schema
```
chrome.storage.sync:  targetLicense, geminiApiKey, openAIApiKey
chrome.storage.local: messages (per tabId), comparisonBucket (PackageStats[])
```

---

## Build
- **Vite** multi-entry build → `dist/npm-advisor/`
- TypeScript strict mode, `@types/chrome`, path alias `@/*`
- React 19, Tailwind CSS 4, Lucide icons
- Manifest v3, host permissions for all data sources

---

## No implementation changes needed — this plan captures the current state for reference.
