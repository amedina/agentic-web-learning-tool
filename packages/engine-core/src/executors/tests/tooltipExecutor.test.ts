/**
 * Internal dependencies
 */
import { tooltipExecutor } from "../tooltipExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("tooltipExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      showTooltip: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it("should show tooltip with selector and formatted input", async () => {
    const config = { input: "Tip", selector: "#btn" };
    const result = await tooltipExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.showTooltip).toHaveBeenCalledWith("#btn", "Tip");
    expect(result).toBe("Tip");
  });

  it("should throw error if selector is missing", async () => {
    const config = { input: "Tip" };
    await expect(
      tooltipExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires a CSS selector");
  });

  it("should throw error if input is missing", async () => {
    const config = { selector: "#btn" };
    await expect(
      tooltipExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input description/text");
  });
});
