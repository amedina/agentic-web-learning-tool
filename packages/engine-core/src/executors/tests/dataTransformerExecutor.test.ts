/**
 * Internal dependencies
 */
import { dataTransformerExecutor } from "../dataTransformerExecutor";
import type { ExecutionContext } from "../../types";
import type { RuntimeInterface } from "../../runtime";

describe("dataTransformerExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = {} as any;
  });

  it("should default to format-original if no operation provided", async () => {
    const config = { input: "test" };
    const result = await dataTransformerExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(result).toBe("test");
  });

  it("should handle regex operation", async () => {
    const config = {
      input: "Hello 123 World",
      operation: "regex",
      pattern: "(\\d+)",
    };
    const result = await dataTransformerExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(result).toBe("123");

    const badConfig = { input: "test", operation: "regex", pattern: "[" };
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const badResult = await dataTransformerExecutor(
      badConfig,
      mockRuntime,
      mockContext
    );
    expect(badResult).toBe("test");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();

    expect(
      await dataTransformerExecutor(
        { input: "v", operation: "regex" },
        mockRuntime,
        mockContext
      )
    ).toBe("v");
  });

  it("should handle jsonParse operation", async () => {
    const config = {
      input: '{"user": {"name": "Bob"}}',
      operation: "jsonParse",
      path: "user.name",
    };
    const result = await dataTransformerExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(result).toBe("Bob");

    const objectResult = await dataTransformerExecutor(
      { input: '{"a": 1}', operation: "jsonParse" },
      mockRuntime,
      mockContext
    );
    expect(objectResult).toBe('{"a":1}');

    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    expect(
      await dataTransformerExecutor(
        { input: "{invalid", operation: "jsonParse" },
        mockRuntime,
        mockContext
      )
    ).toBe("{invalid");
    consoleSpy.mockRestore();
  });

  it("should handle format operation", async () => {
    expect(
      await dataTransformerExecutor(
        { input: " Hi ", operation: "format", formatType: "trim" },
        mockRuntime,
        mockContext
      )
    ).toBe("Hi");
    expect(
      await dataTransformerExecutor(
        { input: "hi", operation: "format", formatType: "uppercase" },
        mockRuntime,
        mockContext
      )
    ).toBe("HI");
    expect(
      await dataTransformerExecutor(
        { input: "HI", operation: "format", formatType: "lowercase" },
        mockRuntime,
        mockContext
      )
    ).toBe("hi");
    expect(
      await dataTransformerExecutor(
        { input: "test", operation: "format", formatType: "length" },
        mockRuntime,
        mockContext
      )
    ).toBe("4");
    expect(
      await dataTransformerExecutor(
        { input: "orig", operation: "format", formatType: "unknown" },
        mockRuntime,
        mockContext
      )
    ).toBe("orig");
  });

  it("should handle split operation", async () => {
    const config = {
      input: "a,b,c",
      operation: "split",
      separator: ",",
      index: "1",
    };
    expect(
      await dataTransformerExecutor(config, mockRuntime, mockContext)
    ).toBe("b");
  });

  it("should handle join operation", async () => {
    const config = { input: '["a", "b"]', operation: "join", separator: "-" };
    expect(
      await dataTransformerExecutor(config, mockRuntime, mockContext)
    ).toBe("a-b");

    expect(
      await dataTransformerExecutor(
        { input: "{}", operation: "join" },
        mockRuntime,
        mockContext
      )
    ).toBe("{}");
    expect(
      await dataTransformerExecutor(
        { input: "{", operation: "join" },
        mockRuntime,
        mockContext
      )
    ).toBe("{");
  });

  it("should handle template operation", async () => {
    const config = {
      input: "World",
      operation: "template",
      template: "Hello {{input}}!",
    };
    expect(
      await dataTransformerExecutor(config, mockRuntime, mockContext)
    ).toBe("Hello World!");
  });

  it("should handle filter, map, objectKeys, and objectValues", async () => {
    const f1 = await dataTransformerExecutor(
      {
        input: '[{"id":1},{"id":2}]',
        operation: "filter",
        filterKey: "id",
        filterValue: "1",
      },
      mockRuntime,
      mockContext
    );
    expect(JSON.parse(f1)).toEqual([{ id: 1 }]);
    expect(
      await dataTransformerExecutor(
        { input: "{}", operation: "filter" },
        mockRuntime,
        mockContext
      )
    ).toBe("{}");

    const m1 = await dataTransformerExecutor(
      {
        input: '[{"u":{"n":"A"}},{"u":{"n":"B"}}]',
        operation: "map",
        mapPath: "u.n",
      },
      mockRuntime,
      mockContext
    );
    expect(JSON.parse(m1)).toEqual(["A", "B"]);
    expect(
      await dataTransformerExecutor(
        { input: "{}", operation: "map" },
        mockRuntime,
        mockContext
      )
    ).toBe("{}");

    const k1 = await dataTransformerExecutor(
      { input: '{"a":1}', operation: "objectKeys" },
      mockRuntime,
      mockContext
    );
    expect(JSON.parse(k1)).toEqual(["a"]);
    const v1 = await dataTransformerExecutor(
      { input: '{"a":1}', operation: "objectValues" },
      mockRuntime,
      mockContext
    );
    expect(JSON.parse(v1)).toEqual([1]);

    expect(
      await dataTransformerExecutor(
        { input: "123", operation: "objectKeys" },
        mockRuntime,
        mockContext
      )
    ).toBe("123");
    expect(
      await dataTransformerExecutor(
        { input: "123", operation: "objectValues" },
        mockRuntime,
        mockContext
      )
    ).toBe("123");
  });

  it("should handle default operation", async () => {
    expect(
      await dataTransformerExecutor(
        { input: "v", operation: "invalid" as any },
        mockRuntime,
        mockContext
      )
    ).toBe("v");
  });
});
