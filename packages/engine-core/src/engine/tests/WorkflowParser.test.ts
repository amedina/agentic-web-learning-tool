/**
 * Internal dependencies
 */

import { WorkflowParser } from "../WorkflowParser";
import type { WorkflowJSON } from "../../types";

describe("WorkflowParser", () => {
  let parser: WorkflowParser;

  beforeEach(() => {
    parser = new WorkflowParser();
  });

  describe("parse", () => {
    it("should correctly parse a valid workflow", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test-wf",
          name: "Test",
          description: "d",
          version: "1.0",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            {
              id: "node-1",
              type: "staticInput",
              config: { inputValue: "Hello" },
            },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "node-1" },
            { id: "e2", source: "node-1", target: "end" },
          ],
        },
      };

      const parsed = parser.parse(workflow);

      expect(parsed.nodes.size).toBe(3);
      expect(parsed.adjacencyList.get("start")).toEqual([
        { target: "node-1", sourceHandle: undefined },
      ]);
      expect(parsed.inDegree.get("node-1")).toBe(1);
      expect(parsed.inDegree.get("start")).toBe(0);
    });

    it("should throw error if meta.id is missing", () => {
      const workflow: any = { graph: { nodes: [], edges: [] } };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow must have a meta.id",
      );
    });

    it("should throw error if graph is missing", () => {
      const workflow: any = { meta: { id: "test" } };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow must have a graph",
      );
    });

    it("should throw error if nodes array is missing", () => {
      const workflow: any = { meta: { id: "test" }, graph: { edges: [] } };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow graph must have a nodes array",
      );
    });

    it("should throw error if edges array is missing", () => {
      const workflow: any = { meta: { id: "test" }, graph: { nodes: [] } };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow graph must have an edges array",
      );
    });

    it("should throw error if multiple start nodes are found", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "s1", type: "start", config: {} },
            { id: "s2", type: "start", config: {} },
            { id: "e1", type: "end", config: {} },
          ],
          edges: [{ id: "e1-1", source: "s1", target: "e1" }],
        },
      };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow can only have one Start node",
      );
    });

    it("should throw error if no start node is found", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "node-1", type: "staticInput", config: {} },
            { id: "e1", type: "end", config: {} },
          ],
          edges: [],
        },
      };
      expect(() => parser.parse(workflow)).toThrow(
        "Workflow must have at least one Start node",
      );
    });

    it("should throw error if a node has multiple incoming edges", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "node-1", type: "staticInput", config: {} },
            { id: "node-2", type: "staticInput", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "node-2" },
            { id: "e2", source: "node-1", target: "node-2" },
            { id: "e3", source: "node-2", target: "end" },
          ],
        },
      };
      expect(() => parser.parse(workflow)).toThrow(
        "has multiple incoming edges",
      );
    });

    it("should throw error if multiple end nodes are found", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "t",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "e1", type: "end", config: {} },
            { id: "e2", type: "end", config: {} },
          ],
          edges: [{ id: "e", source: "start", target: "e1" }],
        },
      };
      expect(() => parser.parse(workflow)).toThrow("Found multiple End nodes");
    });

    it("should throw error if no end node is found", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "t",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "node-1", type: "staticInput", config: {} },
          ],
          edges: [],
        },
      };
      expect(() => parser.parse(workflow)).toThrow("at least one End node");
    });
  });

  describe("getExecutionPlan", () => {
    it("should return nodes in topological order", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "node-1", type: "staticInput", config: {} },
            { id: "node-2", type: "staticInput", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "node-1" },
            { id: "e2", source: "node-1", target: "node-2" },
            { id: "e3", source: "node-2", target: "end" },
          ],
        },
      };

      const parsed = parser.parse(workflow);
      const plan = parser.getExecutionPlan(parsed);

      expect(plan.map((n) => n.id)).toEqual([
        "start",
        "node-1",
        "node-2",
        "end",
      ]);
    });

    it("should throw error if cycle is detected", () => {
      const workflowCycle: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "n1", type: "staticInput", config: {} },
            { id: "n2", type: "staticInput", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "n1" },
            { id: "e2", source: "n1", target: "n2" },
            { id: "e3", source: "n2", target: "n1" },
            { id: "e4", source: "n2", target: "end" },
          ],
        },
      };

      expect(() => parser.parse(workflowCycle)).toThrow(
        "has multiple incoming edges",
      );
    });

    it("should return empty plan if start node is missing in parsed graph", () => {
      const parsed: any = {
        nodes: new Map(),
        adjacencyList: new Map(),
        inDegree: new Map(),
      };
      expect(parser.getExecutionPlan(parsed)).toEqual([]);
    });

    it("should throw deterministic cycle error in getExecutionPlan", () => {
      const nodes = new Map();
      nodes.set("start", { id: "start", type: "start", config: {} });
      nodes.set("n1", { id: "n1", type: "staticInput", config: {} });

      const adj = new Map();
      adj.set("start", [{ target: "n1" }]);
      adj.set("n1", [{ target: "n1" }]); // cycle

      const inDegree = new Map();
      inDegree.set("start", 0);
      inDegree.set("n1", 2); // start->n1 and n1->n1

      expect(() =>
        parser.getExecutionPlan({
          nodes,
          adjacencyList: adj,
          inDegree,
          edges: [],
          reverseAdjacencyList: new Map(),
        } as any),
      ).toThrow("Workflow graph contains cycles");
    });
  });

  describe("getInputNodes", () => {
    it("should return source nodes for a target node", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "n1", type: "staticInput", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "n1" },
            { id: "e2", source: "n1", target: "end" },
          ],
        },
      };
      const parsed = parser.parse(workflow);
      const inputs = parser.getInputNodes(parsed, "n1");
      expect(inputs).toHaveLength(1);
      expect(inputs[0].id).toBe("start");
    });
  });

  describe("getRequiredCapabilities", () => {
    it("should identify required AI capabilities", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "n1", type: "promptApi", config: {} },
            {
              id: "n2",
              type: "translatorApi",
              config: { sourceLanguage: "en", targetLanguage: "fr" },
            },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "n1" },
            { id: "e2", source: "n1", target: "n2" },
            { id: "e3", source: "n2", target: "end" },
          ],
        },
      };
      const parsed = parser.parse(workflow);
      const caps = parser.getRequiredCapabilities(parsed);

      expect(caps).toEqual({
        promptApi: true,
        translatorApi: { sourceLanguage: "en", targetLanguage: "fr" },
      });
    });
  });

  describe("getReachableNodes", () => {
    it("should return nodes reachable from a node through a specific handle", () => {
      const workflow: WorkflowJSON = {
        meta: {
          id: "test",
          name: "Test",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "loop", type: "loop", config: {} },
            { id: "item-node", type: "staticInput", config: {} },
            { id: "after-node", type: "staticInput", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [
            { id: "e1", source: "start", target: "loop" },
            {
              id: "e2",
              source: "loop",
              target: "item-node",
              sourceHandle: "item",
            },
            {
              id: "e3",
              source: "loop",
              target: "after-node",
              sourceHandle: "done",
            },
            { id: "e4", source: "after-node", target: "end" },
          ],
        },
      };
      const parsed = parser.parse(workflow);

      const itemBranch = parser.getReachableNodes(parsed, "loop", "item");
      expect(itemBranch.map((n) => n.id)).toEqual(["item-node"]);

      // Null means filter for handle-less edges
      const mainBranch = parser.getReachableNodes(parsed, "loop", "done");
      expect(mainBranch.map((n) => n.id)).toEqual(["after-node", "end"]);

      // Undefined means return all reachable nodes regardless of handle
      const allReachable = parser.getReachableNodes(parsed, "loop", undefined);
      const ids = allReachable.map((n) => n.id);
      expect(ids).toContain("item-node");
      expect(ids).toContain("after-node");
      expect(ids).toContain("end");
    });
  });

  describe("Validation Errors", () => {
    it("should throw if node id is missing", () => {
      const wf: any = {
        meta: { id: "t" },
        graph: { nodes: [{ type: "start" }], edges: [] },
      };
      expect(() => parser.parse(wf)).toThrow("Each node must have an id");
    });

    it("should throw if node type is missing", () => {
      const wf: any = {
        meta: { id: "t" },
        graph: { nodes: [{ id: "n1" }], edges: [] },
      };
      expect(() => parser.parse(wf)).toThrow("must have a type");
    });

    it("should throw if edge source is invalid", () => {
      const wf: WorkflowJSON = {
        meta: {
          id: "t",
          name: "t",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [{ id: "e1", source: "missing", target: "end" }],
        },
      };
      expect(() => parser.parse(wf)).toThrow(
        "references non-existent source node",
      );
    });

    it("should throw if edge target is invalid", () => {
      const wf: WorkflowJSON = {
        meta: {
          id: "t",
          name: "t",
          description: "d",
          version: "1",
          allowedDomains: [],
          isWebMCP: false,
          enabled: true,
          savedAt: "2024-01-01T00:00:00.000Z",
        },
        graph: {
          nodes: [
            { id: "start", type: "start", config: {} },
            { id: "end", type: "end", config: {} },
          ],
          edges: [{ id: "e1", source: "start", target: "missing" }],
        },
      };
      expect(() => parser.parse(wf)).toThrow(
        "references non-existent target node",
      );
    });
  });
});
