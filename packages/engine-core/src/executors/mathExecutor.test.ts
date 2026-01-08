import { mathExecutor } from "./mathExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("mathExecutor", () => {
  const mockRuntime = {} as RuntimeInterface;
  const mockContext = {} as ExecutionContext;

  it("should add two numbers", async () => {
    const config = {
      input: "10",
      operation: "add",
      operand: "5",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("15");
  });

  it("should subtract two numbers", async () => {
    const config = {
      input: "10",
      operation: "subtract",
      operand: "4",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("6");
  });

  it("should multiply two numbers", async () => {
    const config = {
      input: "3",
      operation: "multiply",
      operand: "7",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("21");
  });

  it("should divide two numbers", async () => {
    const config = {
      input: "20",
      operation: "divide",
      operand: "4",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("5");
  });

  it("should handle division by zero", async () => {
    const config = {
      input: "10",
      operation: "divide",
      operand: "0",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("Infinity");
  });

  it("should calculate power", async () => {
    const config = {
      input: "2",
      operation: "power",
      operand: "3",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("8");
  });

  it("should calculate square root by default", async () => {
    const config = {
      input: "16",
      operation: "root",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("4");
  });

  it("should calculate nth root", async () => {
    const config = {
      input: "27",
      operation: "root",
      operand: "3",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("3");
  });

  it("should round a number", async () => {
    const config = {
      input: "4.6",
      operation: "round",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("5");
  });

  it("should floor a number", async () => {
    const config = {
      input: "4.9",
      operation: "floor",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("4");
  });

  it("should ceil a number", async () => {
    const config = {
      input: "4.1",
      operation: "ceil",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("5");
  });

  it("should return absolute value", async () => {
    const config = {
      input: "-10.5",
      operation: "abs",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("10.5");
  });

  it("should return NaN for invalid input", async () => {
    const config = {
      input: "abc",
      operation: "add",
      operand: "5",
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("NaN");
  });

  it("should return original input for unknown operation", async () => {
    const config = {
      input: "10",
      operation: "unknown" as any,
    };
    const result = await mathExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("10");
  });
});
