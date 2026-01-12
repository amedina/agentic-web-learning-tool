/**
 * Internal dependencies
 */
import { NodeRegistry } from "../NodeRegistry";

describe("NodeRegistry", () => {
  beforeEach(() => {
    NodeRegistry.clear();
  });

  it("should register and retrieve an executor", () => {
    const mockExecutor = jest.fn();
    NodeRegistry.register("test-node", mockExecutor);

    expect(NodeRegistry.has("test-node")).toBe(true);
    expect(NodeRegistry.get("test-node")).toBe(mockExecutor);
  });

  it("should throw error if executor is not registered", () => {
    expect(() => NodeRegistry.get("missing")).toThrow("No executor registered");
  });

  it("should return all registered types", () => {
    NodeRegistry.register("node-a", jest.fn());
    NodeRegistry.register("node-b", jest.fn());

    expect(NodeRegistry.getRegisteredTypes()).toEqual(["node-a", "node-b"]);
  });

  it("should clear executors", () => {
    NodeRegistry.register("node-a", jest.fn());
    NodeRegistry.clear();
    expect(NodeRegistry.getRegisteredTypes()).toHaveLength(0);
  });
});
