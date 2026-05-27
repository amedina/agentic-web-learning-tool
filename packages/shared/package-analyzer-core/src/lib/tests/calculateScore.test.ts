/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { calculateScore } from "../calculateScore";

describe("calculateScore", () => {
  it("returns the precomputed score when present", () => {
    expect(calculateScore({ score: 78 })).toBe(78);
  });

  it("returns null when score is missing", () => {
    expect(calculateScore({})).toBeNull();
  });

  it("returns null when score is null", () => {
    expect(calculateScore({ score: null })).toBeNull();
  });

  it("returns null when score is undefined", () => {
    expect(calculateScore({ score: undefined })).toBeNull();
  });

  it("returns null for null / undefined input", () => {
    expect(calculateScore(null)).toBeNull();
    expect(calculateScore(undefined)).toBeNull();
  });

  it("does not derive a score from bundle / dependencies / recommendations", () => {
    // Regression guard against the old divergent fallback: a package
    // with no `score` but with bundle and recommendations data must
    // still return null, not synthesise a different number.
    const pkg = {
      bundle: { gzip: 5000 },
      dependencyTree: { dependencies: {} },
      recommendations: {
        nativeReplacements: [{ id: "fetch" }],
      },
    };
    expect(calculateScore(pkg)).toBeNull();
  });

  it("returns zero exactly when the precomputed score is zero", () => {
    // Falsy-but-numeric guard: a heavily-penalised package can have
    // score 0; the accessor must not coerce that to null.
    expect(calculateScore({ score: 0 })).toBe(0);
  });
});
