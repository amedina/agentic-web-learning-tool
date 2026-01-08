import { loopExecutor } from "./loopExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("loopExecutor", () => {
  const mockRuntime = {} as RuntimeInterface;

  it("should throw error if executeBranch is not provided", async () => {
    const config = { input: [1, 2, 3] };
    const context = { status: "running" } as ExecutionContext;

    await expect(
      loopExecutor(config, mockRuntime, context, undefined as any)
    ).rejects.toThrow("executeBranch is required");
  });

  it("should iterate over array and call executeBranch for each item", async () => {
    const config = { input: ["a", "b", "c"] };
    const context = { status: "running" } as ExecutionContext;
    const executeBranch = jest
      .fn()
      .mockImplementation((handle, data) => Promise.resolve(`result-${data}`));

    const result = await loopExecutor(
      config,
      mockRuntime,
      context,
      executeBranch
    );

    expect(executeBranch).toHaveBeenCalledTimes(3);
    expect(executeBranch).toHaveBeenNthCalledWith(1, "item", "a");
    expect(executeBranch).toHaveBeenNthCalledWith(2, "item", "b");
    expect(executeBranch).toHaveBeenNthCalledWith(3, "item", "c");
    expect(result).toEqual(["result-a", "result-b", "result-c"]);
  });

  it("should handle non-array input as a single-item array", async () => {
    const config = { input: "single" };
    const context = { status: "running" } as ExecutionContext;
    const executeBranch = jest.fn().mockResolvedValue("done");

    const result = await loopExecutor(
      config,
      mockRuntime,
      context,
      executeBranch
    );

    expect(executeBranch).toHaveBeenCalledTimes(1);
    expect(executeBranch).toHaveBeenCalledWith("item", "single");
    expect(result).toEqual(["done"]);
  });

  it("should update and cleanup loop context", async () => {
    const config = { input: [1] };
    const context = { status: "running" } as any;
    const executeBranch = jest.fn().mockImplementation(() => {
      // Check context during execution
      expect(context.loop).toEqual({ index: 0, total: 1 });
      return Promise.resolve("ok");
    });

    await loopExecutor(config, mockRuntime, context, executeBranch);

    expect(context.loop).toBeUndefined();
  });
});
