/**
 * External dependencies.
 */
import { describe, it, expect, vi } from "vitest";

/**
 * Internal dependencies.
 */
import { checkLicenseCompatibility } from "../../lib/checkLicenseCompatibility";

vi.mock("../../assets/licence-comp-matrixseqexpl.json", () => ({
  default: {
    licenses: [
      {
        name: "MIT",
        compatibilities: [
          {
            name: "Apache-2.0",
            compatibility: "Yes",
            explanation: "Compatible",
          },
          { name: "GPL-3.0", compatibility: "No", explanation: "Incompatible" },
        ],
      },
    ],
  },
}));

describe("checkLicenseCompatibility", () => {
  it("should return null if package license is missing", () => {
    expect(checkLicenseCompatibility("", "MIT")).toBeNull();
  });

  it("should return null and warn if target project license is not in matrix", () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = checkLicenseCompatibility("MIT", "UNKNOWN_LIC");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      '[NPM Advisor] Target Project License "UNKNOWN_LIC" not found in matrix.',
    );
    consoleSpy.mockRestore();
  });

  it("should return isCompatible true if package license is marked Yes", () => {
    const result = checkLicenseCompatibility("Apache-2.0", "MIT");
    expect(result).toEqual({ isCompatible: true, explanation: "Compatible" });
  });

  it("should return isCompatible false if package license is marked No", () => {
    const result = checkLicenseCompatibility("GPL-3.0", "MIT");
    expect(result).toEqual({
      isCompatible: false,
      explanation: "Incompatible",
    });
  });

  it("should return isCompatible false if compatibility match is not found", () => {
    const result = checkLicenseCompatibility("Unlisted-License", "MIT");
    expect(result).toEqual({
      isCompatible: false,
      explanation: `Compatibility mapping for "Unlisted-License" against "MIT" not found in matrix.`,
    });
  });

  it("should return null for licenses starting with 'SEE LICENSE IN'", () => {
    expect(
      checkLicenseCompatibility(
        "SEE LICENSE IN https://github.com/foo/bar/LICENSE",
        "MIT",
      ),
    ).toBeNull();
    expect(
      checkLicenseCompatibility("see license in some-file", "MIT"),
    ).toBeNull();
  });

  it("should return null for licenses that are direct HTTP or HTTPS URLs", () => {
    expect(
      checkLicenseCompatibility("https://custom-license.com", "MIT"),
    ).toBeNull();
    expect(
      checkLicenseCompatibility("http://custom-license.com", "MIT"),
    ).toBeNull();
  });
});
