/**
 * External dependencies
 */
import {
  listWorkflows,
  type WorkflowMetadata,
} from "@google-awlt/engine-extension";

/**
 * Get unique name and sanitized name for a workflow to avoid collisions.
 *
 * @param name The desired display name.
 * @param excludeId ID of the workflow to exclude from collision checks (e.g., the workflow being edited).
 * @returns Object containing the original name and a potentially suffixed unique sanitizedName.
 */
export const getUniqueNames = async (
  name: string,
  excludeId?: string,
): Promise<{ name: string; sanitizedName: string }> => {
  const list = await listWorkflows();
  const existingWorkflows = list.map((w: { meta: WorkflowMetadata }) => w.meta);

  let sanitizedName = name.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "_");
  let counter = 1;

  const isDuplicate = (sName: string) =>
    existingWorkflows.some(
      (w) => w.sanitizedName === sName && w.id !== excludeId,
    );

  const baseSanitizedName = sanitizedName;

  while (isDuplicate(sanitizedName)) {
    sanitizedName = `${baseSanitizedName}_${counter}`;
    counter++;
  }

  return { name, sanitizedName };
};
