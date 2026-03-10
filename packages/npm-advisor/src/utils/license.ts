import licenseMatrixData from "../assets/licence-comp-matrixseqexpl.json";

// In the future, this should be fetched from the developer's extension settings.
export const TARGET_PROJECT_LICENSE = "MIT";

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
): LicenseCompatibilityResult | null {
  if (!packageLicense) return null;

  // We look for our target project license in the main array
  const targetLicenseEntry = licenseMatrixData.licenses.find(
    (l: any) => l.name === TARGET_PROJECT_LICENSE,
  );

  if (!targetLicenseEntry) {
    console.warn(
      `[NPM Advisor] TARGET_PROJECT_LICENSE "${TARGET_PROJECT_LICENSE}" not found in matrix.`,
    );
    return null;
  }

  // Then look for the package's license in the compatibilities array
  const compatibilityMatch = targetLicenseEntry.compatibilities.find(
    (c: any) => c.name === packageLicense,
  );

  if (!compatibilityMatch) {
    return {
      isCompatible: false,
      explanation: `Compatibility mapping for "${packageLicense}" against "${TARGET_PROJECT_LICENSE}" not found in matrix.`,
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
