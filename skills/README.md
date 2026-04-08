# Skills

This directory contains three agent skills that teach developers how to build
modern, AI-enhanced web experiences. Each skill is a self-contained knowledge
pack with a main guide (`SKILL.md`), reference documentation, evaluation test
cases, and (where applicable) helper scripts.

## Chrome Built-in AI (`chrome-ai/`)

Six sub-skills covering every Chrome on-device AI API powered by Gemini Nano.
All APIs run locally in the browser -- no API keys, no network round-trips.

| Sub-skill | API surface | What it does |
|-----------|------------|--------------|
| **Prompt API** | `LanguageModel` | General-purpose text generation, multi-turn chat, multimodal inputs (image/audio), and JSON-Schema-constrained structured output. |
| **Summarizer API** | `Summarizer` | Purpose-built summarization with four output types (TL;DR, key-points, teaser, headline) and configurable length. |
| **Writer API** | `Writer` | Content generation (emails, blog posts, reviews) with tone, length, and format controls. |
| **Rewriter API** | `Rewriter` | Text revision and restructuring -- adjust tone, length, or format relative to the original. |
| **Proofreader API** | `Proofreader` | Grammar, spelling, and punctuation correction with optional correction types and explanations. |
| **Translator API** | `Translator` + `LanguageDetector` | On-device translation with automatic language-detection fallback. |

Every sub-skill follows the same lifecycle: **availability check -> create
instance -> use (streaming or batch) -> destroy**, and includes reference docs
for advanced patterns plus an `evals/` folder with automated test cases.

## Web Compatibility Audit (`web-compat-audit/`)

A five-stage pipeline that audits a web project for cross-browser compatibility
issues and produces a unified HTML report with per-finding remediation steps.

**Pipeline stages:**

1. **Resolve targets** -- read Browserslist configuration (or apply sensible
   defaults).
2. **Static analysis** (parallel) -- ESLint (`eslint-plugin-compat`) for JS/Web
   API surface, stylelint for CSS features, `@e18e/cli` for dependency bloat.
3. **Runtime analysis** -- Lighthouse CLI for deprecations and best-practice
   violations.
4. **Merge & enrich** -- combine all findings; optionally enrich with the
   `modern-web` MCP server for best-practice guidance.
5. **Render report** -- generate a self-contained HTML report.

All tools are invoked via `npx`, so the audit is non-invasive and does not
modify the target project's dependencies. Helper scripts live in `scripts/`.

## WebMCP Builder (`webmcp-builder/`)

A guide for building **WebMCP tools** -- client-side JavaScript interfaces that
expose web-app functionality to AI agents through the
`navigator.modelContext` API.

**Core concepts:**

- **Tool contract** -- each tool declares a `name`, natural-language
  `description`, JSON Schema `inputSchema`, and an `execute` function.
- **Annotations** -- `readOnlyHint`, `destructiveHint`, `idempotentHint`,
  `openWorldHint` let the agent reason about side-effects.
- **Human-in-the-loop** -- `agent.requestUserInteraction()` gates destructive
  actions behind user confirmation.
- **Framework-agnostic** -- works with vanilla JS, React, Vue, Svelte, or any
  other stack.

The skill walks through a four-phase process (requirements, design,
implementation, testing) and includes reference material for advanced patterns
(SPA routing, service workers, security hardening), full examples in vanilla JS
and React, and a scaffold script (`scripts/scaffold-webmcp-tool.js`) for
generating tool boilerplate.
