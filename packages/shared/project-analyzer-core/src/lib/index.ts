/**
 * lib/ — substantial, environment-agnostic project-level analyzers.
 *
 * A file belongs here when it encodes business rules, non-trivial algorithms,
 * or orchestrates multiple data sources for whole-project analysis (e.g.
 * publint runs, lockfile-aware replacement rollups, top-level analyzeProject).
 *
 * Rule of thumb: if removing it would change *what* the project analyzer does,
 * it's lib/. If removing it would only change *how* a utility works, it's utils/.
 */
export {};
