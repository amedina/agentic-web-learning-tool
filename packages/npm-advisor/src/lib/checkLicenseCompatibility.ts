/**
 * Internal dependencies.
 */
import licenseMatrixDataRaw from "../assets/licence-comp-matrixseqexpl.json";

const licenseMatrixData = licenseMatrixDataRaw as any;

// Default fallback license if none is set by the user

export const DEFAULT_TARGET_PROJECT_LICENSE = "MIT";

export interface LicenseCompatibilityResult {
  isCompatible: boolean;
  explanation: string | null;
}

/**
 * Checks if a given package license is compatible with the user's TARGET_PROJECT_LICENSE.
 * It uses the OSADL compatibility matrix JSON.
 */
export function checkLicenseCompatibility(
  packageLicense: string,
  targetProjectLicense: string = "MIT",
): LicenseCompatibilityResult | null {
  if (!packageLicense) return null;

  const licenseStr = packageLicense.trim();
  const licenseUpper = licenseStr.toUpperCase();
  if (
    licenseUpper.startsWith("SEE LICENSE IN") ||
    licenseStr.startsWith("http://") ||
    licenseStr.startsWith("https://")
  ) {
    return null;
  }

  // We look for our target project license in the main array
  const targetLicenseEntry = licenseMatrixData.licenses.find(
    (l: any) => l.name.toLowerCase() === targetProjectLicense.toLowerCase(),
  );

  if (!targetLicenseEntry) {
    console.warn(
      `[NPM Advisor] Target Project License "${targetProjectLicense}" not found in matrix.`,
    );
    return null;
  }

  // Then look for the package's license in the compatibilities array
  const compatibilityMatch = targetLicenseEntry.compatibilities.find(
    (c: any) => c.name.toLowerCase() === packageLicense.toLowerCase(),
  );

  if (!compatibilityMatch) {
    return {
      isCompatible: false,
      explanation: `Compatibility mapping for "${packageLicense}" against "${targetProjectLicense}" not found in matrix.`,
    };
  }

  const isCompatible =
    compatibilityMatch.compatibility === "Yes" ||
    compatibilityMatch.compatibility === "Same";

  return {
    isCompatible,
    explanation: compatibilityMatch.explanation || null,
  };
}
