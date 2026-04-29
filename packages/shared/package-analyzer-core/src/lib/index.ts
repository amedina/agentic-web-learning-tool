/**
 * lib/ — substantial, environment-agnostic domain logic.
 *
 * A file belongs here when it encodes business rules, non-trivial algorithms,
 * or orchestrates multiple data sources (e.g. scoring, license compatibility,
 * dependency tree building, package stat aggregation).
 *
 * Rule of thumb: if removing it would change *what* the extension does, it's lib/.
 * If removing it would only change *how* a utility works, it's utils/.
 */
export * from "./getPackageStats";
export * from "./getDependencyTree";
export * from "./checkLicenseCompatibility";
export * from "./calculateScore";
