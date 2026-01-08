import { conditionExecutor } from "./conditionExecutor";
import type { ExecutionContext } from "../types";
import type { RuntimeInterface } from "../runtime";

describe("conditionExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = {} as any;
  });

  it("should handle all operators", async () => {
    const success = "Comparison was success";
    const failure = "Comparison was failure";

    expect(
      await conditionExecutor(
        { input: "a", operator: "equals", compareValue: "a" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "a", operator: "equals", compareValue: "b" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "a", operator: "notEquals", compareValue: "b" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "a", operator: "notEquals", compareValue: "a" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "abc", operator: "contains", compareValue: "b" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "abc", operator: "contains", compareValue: "d" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "abc", operator: "notContains", compareValue: "d" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "abc", operator: "notContains", compareValue: "b" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "abc", operator: "startsWith", compareValue: "a" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "abc", operator: "endsWith", compareValue: "c" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);

    expect(
      await conditionExecutor(
        { input: "  ", operator: "isEmpty" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "a", operator: "isEmpty" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "a", operator: "isNotEmpty" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: " ", operator: "isNotEmpty" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "10", operator: "greaterThan", compareValue: "5" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "5", operator: "greaterThan", compareValue: "10" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);

    expect(
      await conditionExecutor(
        { input: "5", operator: "lessThan", compareValue: "10" },
        mockRuntime,
        mockContext
      )
    ).toContain(success);
    expect(
      await conditionExecutor(
        { input: "10", operator: "lessThan", compareValue: "5" },
        mockRuntime,
        mockContext
      )
    ).toContain(failure);
  });

  it("should handle default operator (isNotEmpty)", async () => {
    expect(
      await conditionExecutor({ input: "a" }, mockRuntime, mockContext)
    ).toContain("success");
    expect(
      await conditionExecutor({ input: "" }, mockRuntime, mockContext)
    ).toContain("failure");
  });

  it("should handle invalid operator as isNotEmpty", async () => {
    expect(
      await conditionExecutor(
        { input: "a", operator: "invalid" as any },
        mockRuntime,
        mockContext
      )
    ).toContain("success");
  });
});
