---
name: explain
description: >
  Read a folder's (or repo's) curated docs and its code, then produce a
  dual-audience explainer: a usage-oriented section for users of the
  tool/project and an architecture-and-implementation section for
  engineers. Use this whenever the user asks to explain, understand,
  walk through, document, or onboard onto a folder, module, package, or
  repository — even if they don't say the word "explain". Invoke
  explicitly as /explain <path>; it does not rely on auto-triggering.
---

# Explain

Produce a clear, grounded explainer of a folder or repository for two
audiences at once: people who *use* the tool/project, and engineers who
want to understand *how it's built*.

Target to explain: **$ARGUMENTS**
(If no path was given, ask which folder or repo to explain before
proceeding. Default to the current working directory only if the user
confirms.)

## Step 1 — Read the curated docs first

Before reading code, read any developer-supplied docs in the target and
its immediate subfolders, in this order of authority:

1. `README.md` in the target folder
2. Any `docs/`, `ARCHITECTURE.md`, `DESIGN.md`, or similar in the target
3. `README.md` files one level down (subfolder-level notes)
4. The repo-root `README.md` for overall framing

Treat these as **authoritative on intent** — the *why*, the invariants,
the boundaries, and the gotchas that aren't visible in the code. They are
the developer's hints to you. Note what they claim so you can check it
against the code in Step 3.

If the target has no curated docs, say so plainly in the output (it tells
the reader the explanation is reconstructed purely from code) and
continue.

## Step 2 — Read the code

Map the target by exploration, not assumption:

- Identify entry points and the public surface (exports, CLI, routes,
  handlers, main classes/functions).
- Sketch the internal structure: the main components and what each is
  responsible for.
- Trace the primary data/control flow — how a typical request, command,
  or task moves through the code from entry to result.
- Note the key abstractions and the patterns in use (e.g. repository
  pattern, dependency injection, event bus, state machine), and where
  they're implemented.
- Note external dependencies and integration points (databases, APIs,
  queues, other internal modules).

Ground every claim in specific files. Prefer "see `src/auth/session.ts`"
over vague description. Do not invent behavior you haven't read.

## Step 3 — Reconcile docs against code

Compare what the docs claim with what the code does. Where they agree,
you can state it with confidence. Where they diverge — stale docs,
undocumented behavior, a pattern the docs don't mention — **flag the
mismatch explicitly**. Mismatches are some of the most valuable output:
they tell the reader (and the maintainer) where the map and the territory
have drifted apart.

## Step 4 — Write the explainer

Produce a single explainer document with two clearly separated layers, so
each audience can read the part that serves them. Default to writing it to
`docs/explainers/<target-name>.md` (create the directory if needed) and
tell the user the path. If the user asked for it inline, return it in the
conversation instead.

Use this structure:

```
# <Target name> — Explainer

## Summary
One short paragraph: what this is and what problem it solves. Plain
language, no jargon. Readable by anyone.

---

## For users
What the tool/project/module does, framed around what someone can
accomplish with it.
- **What it does** — capabilities in user terms.
- **How to use it** — entry points, key commands/APIs, a minimal
  example of the common path.
- **Key concepts** — the handful of terms a user must understand,
  defined briefly.
- **Common workflows** — the 2–4 things people most often do with it.

---

## For engineers
How it's built and why.
- **Responsibilities & boundaries** — what this code owns, and what it
  deliberately does *not* do or touch.
- **Architecture** — the main components and how they fit together.
  Include a simple diagram (ASCII or mermaid) when it aids understanding.
- **Data / control flow** — a walkthrough of how a typical request or
  task flows through the system, naming the files involved.
- **Key abstractions** — the core types/interfaces and the reasoning
  behind them.
- **Patterns & conventions** — the design patterns in use and where,
  plus naming/structural conventions a contributor should follow.
- **External dependencies & integration points** — what it talks to and
  how.
- **Gotchas & non-obvious decisions** — the things that would surprise a
  newcomer, and any doc/code mismatches found in Step 3.
- **Invariants** — what must always hold for the code to be correct.

---

## Pointers
Where to look next: related folders, deeper docs, the most important
files to read first.
```

## Quality bar

- Every architectural claim traces to a file you actually read.
- Plain language in the user section; precise, technical language in the
  engineer section. Don't blur them.
- Surface the non-obvious. If the explainer only restates what the code
  obviously shows, it has failed its purpose.
- Be honest about uncertainty. If a flow is unclear or you couldn't
  confirm something, say so rather than guessing.

## Variations

- **Quick analysis into chat (no file):** if the user just wants
  understanding fast and doesn't need a saved document, you can run this
  as a read-only exploration and return the explainer in the
  conversation. (To make this skill default to that mode, add
  `context: fork` and `agent: Explore` to the frontmatter — note that a
  forked Explore agent is read-only and cannot write the file.)
- **Repo-wide explainer:** if the target is a whole repo, do Step 2 at
  the top level first (overall architecture), then optionally drill into
  the 2–3 most important subfolders, each as its own engineer-section
  subsection.
