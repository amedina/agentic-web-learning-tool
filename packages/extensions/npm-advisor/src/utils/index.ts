/**
 * utils/ — small, generic, single-purpose helpers.
 *
 * A file belongs here when it is a thin wrapper, a pure transformation, or an
 * infrastructure primitive with no domain knowledge (e.g. HTTP cache, URL
 * parser, file download trigger, raw API fetch wrappers).
 *
 * Rule of thumb: if it could live in any project without modification, it's utils/.
 * If it contains logic specific to npm/GitHub/scoring, it belongs in lib/.
 */
export * from "./fetchWithCache";
export * from "./fetchNpmPackage";
export * from "./fetchGithubRepo";
export * from "./fetchGithubIssues";
export * from "./fetchGithubSecurityAdvisories";
export * from "./fetchBundlephobiaData";
export * from "./fetchModuleReplacements";
export * from "./parseGithubUrl";
export * from "./downloadMarkdownFile";
