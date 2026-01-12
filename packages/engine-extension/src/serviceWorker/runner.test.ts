import { WorkflowRunner, getWorkflowRunner } from "./runner";
import { ServiceWorkerRuntime } from "./runtime";
import { WorkflowEngine } from "@google-awlt/engine-core";
import * as engineCore from "@google-awlt/engine-core";

jest.mock("./runtime");
jest.mock("@google-awlt/engine-core", () => {
  const original = jest.requireActual("@google-awlt/engine-core");
  return {
    ...original,
    WorkflowEngine: jest.fn().mockImplementation(() => ({
      execute: jest.fn().mockResolvedValue({ status: "completed" }),
      abort: jest.fn(),
    })),
    registerBuiltinExecutors: jest.fn(),
  };
});

describe("WorkflowRunner", () => {
  let runner: WorkflowRunner;

  beforeEach(() => {
    jest.clearAllMocks();
    runner = new WorkflowRunner();
  });

  it("should initialize only once", async () => {
    const wf = { meta: { id: "1" }, graph: { nodes: [], edges: [] } } as any;
    await runner.run(wf);
    await runner.run(wf);
    expect(engineCore.registerBuiltinExecutors).toHaveBeenCalledTimes(1);
  });

  it("should set tabId and callbacks on runtime", async () => {
    const wf = { meta: { id: "1" }, graph: { nodes: [], edges: [] } } as any;
    const callbacks = { onNodeStart: jest.fn() };
    await runner.run(wf, 123, callbacks);

    const runtimeInstance = (ServiceWorkerRuntime as jest.Mock).mock
      .instances[0];
    expect(runtimeInstance.setTargetTab).toHaveBeenCalledWith(123);
    expect(runtimeInstance.setCallbacks).toHaveBeenCalledWith(callbacks);
  });

  it("should execute workflow using engine", async () => {
    const wf = { meta: { id: "1" }, graph: { nodes: [], edges: [] } } as any;
    const result = await runner.run(wf);
    expect(result).toEqual({ status: "completed" });

    const engineInstance = (WorkflowEngine as jest.Mock).mock.results[0].value;
    expect(engineInstance.execute).toHaveBeenCalledWith(wf);
  });

  it("should stop workflow", () => {
    runner.stop();
    const engineInstance = (WorkflowEngine as jest.Mock).mock.results[0].value;
    expect(engineInstance.abort).toHaveBeenCalled();
  });

  describe("checkCapabilities", () => {
    it("should check array of capabilities", async () => {
      const runtimeInstance = (ServiceWorkerRuntime as jest.Mock).mock
        .instances[0];
      runtimeInstance.checkCapability.mockResolvedValue(true);

      const results = await runner.checkCapabilities(["cap1", "cap2"]);
      expect(results).toEqual({ cap1: true, cap2: true });
      expect(runtimeInstance.checkCapability).toHaveBeenCalledWith("cap1");
      expect(runtimeInstance.checkCapability).toHaveBeenCalledWith("cap2");
    });

    it("should check object of capabilities", async () => {
      const runtimeInstance = (ServiceWorkerRuntime as jest.Mock).mock
        .instances[0];
      runtimeInstance.checkCapability.mockResolvedValue(true);

      const results = await runner.checkCapabilities({ cap1: { opt: 1 } });
      expect(results).toEqual({ cap1: true });
      expect(runtimeInstance.checkCapability).toHaveBeenCalledWith("cap1", {
        opt: 1,
      });
    });
  });

  it("should maintain singleton instance", () => {
    const r1 = getWorkflowRunner();
    const r2 = getWorkflowRunner();
    expect(r1).toBe(r2);
  });
});
