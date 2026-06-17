<!--
  README template — fuel for the /explain skill.

  Fill this in for any folder you want an agent to understand well.
  The goal is to capture what an agent CANNOT recover by reading the
  code: intent, rationale, boundaries, invariants, and gotchas.
  If a line just restates what the code obviously shows, delete it —
  redundant detail adds noise without adding understanding.

  Rule of thumb: write down what a senior engineer would tell a newcomer
  in a hallway conversation that isn't written anywhere in the source.

  Delete these comment blocks (and any sections that don't apply) once
  filled in.
-->

# <Folder / module name>

<!-- One paragraph, plain language: what this is and the problem it
     solves. Readable by a non-engineer. This anchors the "Summary" and
     "For users" parts of the explainer. -->

## What it does

<!-- Capabilities in user terms — what someone can accomplish with this.
     Not an API dump; the value it provides. -->

## How to use it

<!-- Entry points, key commands/APIs/routes, and a minimal example of the
     most common path. Keep it concrete. -->

## Key concepts & terminology

<!-- The handful of terms someone must understand to work with this, each
     defined in a sentence. Include any project-specific vocabulary
     ("ALWAYS call it X, never Y") that the code alone won't teach. -->

---

## Responsibilities & boundaries

<!-- HIGH VALUE. What this folder owns, and — just as important — what it
     deliberately does NOT do. State the boundaries other code must
     respect: e.g. "this module owns all auth state; never read the
     session table directly from elsewhere." -->

## Architecture & key components

<!-- The main pieces inside this folder and what each is responsible for.
     A short list of "this file/dir does X" pointers. A simple diagram is
     welcome if the structure isn't obvious. -->

## Patterns & conventions

<!-- HIGH VALUE. The design patterns in use (repository pattern, event
     bus, state machine, etc.) and where. Plus structural/naming
     conventions a contributor should follow to stay consistent. -->

## Data / control flow

<!-- How a typical request, command, or task moves through this code from
     entry to result. The narrative the code makes you reconstruct by
     hand — write it down once. -->

## Key abstractions & the reasoning behind them

<!-- HIGH VALUE. The core types/interfaces, and WHY they're shaped the way
     they are. Rationale is exactly what the code can't tell the reader. -->

## External dependencies & integration points

<!-- What this talks to (databases, APIs, queues, other internal modules)
     and how. Note anything non-standard about those integrations. -->

## Gotchas & non-obvious decisions

<!-- HIGH VALUE. The things that surprise newcomers. Workarounds, sharp
     edges, "looks wrong but is intentional because…", performance traps,
     ordering requirements. Each entry saves someone an hour. -->

## Invariants

<!-- What must ALWAYS hold for this code to be correct. State them as
     rules: "X must be initialized before Y", "this list is always sorted
     by Z". Violations here cause subtle bugs. -->

---

## Pointers

<!-- Where to look next: related folders, deeper design docs, and the 2–3
     most important files to read first. -->
