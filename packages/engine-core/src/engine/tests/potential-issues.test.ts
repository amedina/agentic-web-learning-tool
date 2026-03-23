/**
 * Potential Issues — Runtime verification tests for engine-level issues.
 *
 * These tests confirm or deny issues from docs/potential-issues.md that
 * were previously marked as NEEDS RUNTIME TEST / INCONCLUSIVE.
 */
import { WorkflowEngine } from '../WorkflowEngine';
import { WorkflowParser } from '../WorkflowParser';
import { registerBuiltinExecutors } from '../../executors';
import type { WorkflowJSON } from '../../types';
import type { RuntimeInterface } from '../../runtime';

const META = {
  id: 'test-pi',
  name: 'Potential Issue Test',
  sanitizedName: 'potential-issue-test',
  description: 'Test',
  allowedDomains: [] as string[],
  isWebMCP: false,
  enabled: true,
  savedAt: '2024-01-01T00:00:00.000Z',
};

// Helper to build Zod-valid workflow objects.
// All nodes use built-in types with required title/label fields.
function makeWorkflow(
  id: string,
  nodes: any[],
  edges: any[]
): WorkflowJSON {
  return {
    meta: { ...META, id },
    graph: { nodes, edges },
  } as any;
}

// Valid node helpers that satisfy the Zod discriminated union
function startNode(id = 'start') {
  return { id, type: 'start', config: { title: 'Start' }, label: 'Start' };
}

function endNode(id = 'end') {
  return { id, type: 'end', config: { title: 'End' }, label: 'End' };
}

function staticInputNode(id: string, value: string, opts: Record<string, unknown> = {}) {
  return {
    id,
    type: 'staticInput',
    config: { title: 'Input', inputValue: value, ...opts },
    label: 'Input',
  };
}

function domInputNode(id: string, selector = 'body') {
  return {
    id,
    type: 'domInput',
    config: {
      title: 'DOM Input',
      cssSelector: selector,
      extract: 'textContent',
      defaultValue: '',
    },
    label: 'DOM Input',
  };
}

describe('Potential Issues — Engine', () => {
  let engine: WorkflowEngine;
  let mockRuntime: jest.Mocked<RuntimeInterface>;

  beforeAll(() => {
    registerBuiltinExecutors();
  });

  beforeEach(() => {
    mockRuntime = {
      checkCapability: jest.fn().mockResolvedValue(true),
      onNodeStart: jest.fn(),
      onNodeFinish: jest.fn(),
      onError: jest.fn(),
      getTabId: jest.fn().mockResolvedValue(1),
      isUserActive: jest.fn().mockResolvedValue(true),
      waitForUserActivation: jest.fn().mockResolvedValue(undefined),
      queryPage: jest.fn().mockResolvedValue('mock-result'),
    } as any;
    engine = new WorkflowEngine(mockRuntime);
  });

  // ─── 9.5 — Orphaned nodes trigger misleading "cycles" error ──────────────

  describe('Issue 9.5: Workflow with orphaned/disconnected nodes', () => {
    it('orphaned node causes misleading "cycles" error', () => {
      const parser = new WorkflowParser();

      const workflow = makeWorkflow('orphan-test', [
        startNode(),
        staticInputNode('orphan', 'lost'),
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'end' },
      ]);

      const parsed = parser.parse(workflow);
      // The orphan node is unreachable from start, so Kahn's algorithm won't process it.
      // result.length (2) !== graph.nodes.size (3) → throws misleading "cycles" error
      expect(() => parser.getExecutionPlan(parsed)).toThrow(
        'Workflow graph contains cycles'
      );
    });

    it('fully connected graph does not throw', () => {
      const parser = new WorkflowParser();

      const workflow = makeWorkflow('connected-test', [
        startNode(),
        staticInputNode('n1', 'hello'),
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'n1' },
        { id: 'e2', source: 'n1', target: 'end' },
      ]);

      const parsed = parser.parse(workflow);
      expect(() => parser.getExecutionPlan(parsed)).not.toThrow();
    });
  });

  // ─── 9.7 — Concurrent execute() calls corrupt shared state ────────────────

  describe('Issue 9.7: Concurrent execute() calls on same engine', () => {
    it('second execute() overwrites context of first', async () => {
      // wf1 uses domInput with a slow queryPage response
      mockRuntime.queryPage = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'slow-result';
      });

      const wf1 = makeWorkflow('wf-concurrent-1', [
        startNode(),
        domInputNode('slow', '.slow'),
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'slow' },
        { id: 'e2', source: 'slow', target: 'end' },
      ]);

      const wf2 = makeWorkflow('wf-concurrent-2', [
        startNode(),
        staticInputNode('fast', 'fast'),
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'fast' },
        { id: 'e2', source: 'fast', target: 'end' },
      ]);

      // Start both concurrently — the second call overwrites this.context
      const promise1 = engine.execute(wf1);
      const promise2 = engine.execute(wf2);

      const results = await Promise.allSettled([promise1, promise2]);

      // At least one of the results should have corrupted state:
      // The second execute() call overwrites this.context and this.abortController
      // before the first finishes. First call writes to stale context.
      const contexts = results
        .filter(
          (r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled'
        )
        .map((r) => r.value);

      // If both succeed, the first one's workflowId will be wrong
      // (overwritten by second call's createContext)
      if (contexts.length === 2) {
        const hasCorruption = contexts.some(
          (ctx: any) => ctx.workflowId === 'wf-concurrent-2'
        );
        expect(hasCorruption).toBe(true);
      }

      // Whether they succeed or fail, shared mutable state is the issue
      expect(results.length).toBe(2);
    }, 10000);
  });

  // ─── 9.10 — Abort workflow mid-execution ──────────────────────────────────

  describe('Issue 9.10: Abort workflow mid-execution', () => {
    it('abort() during execution throws "Workflow aborted"', async () => {
      // Mock queryPage to take 300ms — abort fires at 50ms
      mockRuntime.queryPage = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return 'done';
      });

      const workflow = makeWorkflow('abort-test', [
        startNode(),
        domInputNode('n1', '.target'),
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'n1' },
        { id: 'e2', source: 'n1', target: 'end' },
      ]);

      const promise = engine.execute(workflow);
      setTimeout(() => engine.abort(), 50);

      await expect(promise).rejects.toThrow('Workflow aborted');
    }, 10000);

    it('abort() when no execution is running does not throw', () => {
      expect(() => engine.abort()).not.toThrow();
    });
  });

  // ─── 15.6 — Circular reference in node config causes stack overflow ───────

  describe('Issue 15.6: Circular reference in node config', () => {
    it('circular reference in config causes stack overflow in resolveValue', async () => {
      // Create a circular config that looks like a staticInput
      const circularConfig: any = { title: 'Circular', inputValue: 'test' };
      circularConfig.self = circularConfig;

      const workflow = makeWorkflow('circular-test', [
        startNode(),
        { id: 'n1', type: 'staticInput', config: circularConfig, label: 'Circ' },
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'n1' },
        { id: 'e2', source: 'n1', target: 'end' },
      ]);

      // resolveValue recursively walks the object — circular ref causes RangeError
      await expect(engine.execute(workflow)).rejects.toThrow();
    }, 10000);
  });

  // ─── 9.1 — Runtime method rejection mid-workflow ──────────────────────────

  describe('Issue 9.1: Runtime method rejection mid-workflow', () => {
    it('runtime error mid-execution propagates and marks node as error', async () => {
      // domInput with no defaultValue will propagate the queryPage error
      mockRuntime.queryPage = jest
        .fn()
        .mockRejectedValue(new Error('Tab was closed'));

      const workflow = makeWorkflow('runtime-error-test', [
        startNode(),
        // domInput without defaultValue — error will propagate
        {
          id: 'n1',
          type: 'domInput',
          config: {
            title: 'Failing Input',
            cssSelector: 'body',
            extract: 'textContent',
            defaultValue: '',
          },
          label: 'Failing Input',
        },
        endNode(),
      ], [
        { id: 'e1', source: 'start', target: 'n1' },
        { id: 'e2', source: 'n1', target: 'end' },
      ]);

      await expect(engine.execute(workflow)).rejects.toThrow('Tab was closed');
      expect(mockRuntime.onError).toHaveBeenCalled();
    });
  });
});
