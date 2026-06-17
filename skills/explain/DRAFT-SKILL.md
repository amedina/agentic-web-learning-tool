---
name: repo-explainer
description: Analyze a code repository's architecture and write a reusable
  explainer document for a human audience or to prime a later coding
  session. Use when asked to understand, document, or explain how a
  codebase is structured.
context: fork
agent: Explore
---
Explore thoroughly — check multiple directories and naming conventions
before concluding. Cite concrete `path/to/file.ext:line` references so the
explainer can be used as a map in a later implementation session.

1. Map the repo: entry points, build/test/run commands, top-level layout.
2. Identify module boundaries and each module's responsibility.
3. Trace the main data/control flow through the system.
4. Note key abstractions, external dependencies, and integration points.
5. Capture conventions a contributor must follow: naming, file layout,
   test patterns, error handling, and where new code of each kind belongs.
6. Flag anything surprising or non-obvious for a newcomer.

Write the result to `repo-explainer.md` at the repo root with these
sections:
- **Summary** — one paragraph on what the repo does and how it's built.
- **Architecture overview** — modules, boundaries, and how they relate.
- **Component walkthrough** — each component, its responsibility, and its
  key files (with paths).
- **Request/task flow** — how a typical request or task moves through the
  system end to end.
- **Working in this repo** — build/test/run commands, conventions from
  step 5, and where to add common kinds of changes (feature, bug fix).
- **Gotchas** — the surprising or non-obvious items from step 6.

Report the path to the written file when done.
