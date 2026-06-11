/**
 * Internal dependencies
 */
import { WorkflowEngine } from '../WorkflowEngine';
import { registerBuiltinExecutors } from '../../executors';
import { NodeRegistry } from '../NodeRegistry';
import type { WorkflowJSON } from '../../types';
import type { RuntimeInterface } from '../../runtime';

describe('WorkflowEngine', () => {
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
    } as any;
    engine = new WorkflowEngine(mockRuntime);
  });

  it('should execute a simple linear workflow', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test-wf',
        name: 'Test Workflow',
        description: 'Test',
        version: '1.0',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'node-1', type: 'staticInput', config: { inputValue: '10' } },
          {
            id: 'node-2',
            type: 'math',
            config: { operation: 'add', operand: '5' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e-s-1', source: 'start', target: 'node-1' },
          { id: 'e1-2', source: 'node-1', target: 'node-2' },
          { id: 'e2-e', source: 'node-2', target: 'end' },
        ],
      },
    };

    const context = await engine.execute(workflow);

    expect(context.status).toBe('completed');
    expect(context.steps['node-1'].data).toBe('10');
    expect(context.steps['node-2'].data).toBe('15');
    expect(mockRuntime.onNodeStart).toHaveBeenCalledTimes(4);
    expect(mockRuntime.onNodeFinish).toHaveBeenCalledTimes(4);
  });

  it('should resolve variables between steps', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test-var-wf',
        name: 'Variable Workflow',
        description: 'Test',
        version: '1.0',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          {
            id: 'node-1',
            type: 'staticInput',
            config: { inputValue: 'World' },
          },
          {
            id: 'node-2',
            type: 'staticInput',
            config: { inputValue: 'Hello {{steps.node-1.data}}!' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e-s-1', source: 'start', target: 'node-1' },
          { id: 'e1-2', source: 'node-1', target: 'node-2' },
          { id: 'e2-e', source: 'node-2', target: 'end' },
        ],
      },
    };

    const context = await engine.execute(workflow);

    expect(context.status).toBe('completed');
    expect(context.steps['node-2'].data).toBe('Hello World!');
  });

  it('should handle execution errors', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test-err-wf',
        name: 'Error Workflow',
        description: 'Test',
        version: '1.0',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          {
            id: 'node-1',
            type: 'math',
            config: { input: 'abc', operation: 'add' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e-s-1', source: 'start', target: 'node-1' },
          { id: 'e1-e', source: 'node-1', target: 'end' },
        ],
      },
    };

    // Let's force an error by using a non-existent executor type
    workflow.graph.nodes[1].type = 'nonExistent';

    await expect(engine.execute(workflow)).rejects.toThrow();
    expect(mockRuntime.onError).toHaveBeenCalled();
  });

  it('should fail if required capability is missing', async () => {
    mockRuntime.checkCapability.mockImplementation(async (cap) => {
      if (cap === 'promptApi') return false;
      return true;
    });

    const workflow: WorkflowJSON = {
      meta: {
        id: 'test-wf',
        name: 'Test',
        description: 'Test',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'ai', type: 'promptApi', config: { input: 'Hi' } },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'ai' },
          { id: 'e2', source: 'ai', target: 'end' },
        ],
      },
    };

    await expect(engine.execute(workflow)).rejects.toThrow(
      'Required capability "promptApi" is not available'
    );
  });

  it('should execute sub-graph using Loop executor', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'loop-wf',
        name: 'Loop',
        description: 'Test',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          {
            id: 'provider',
            type: 'staticInput',
            config: { inputValue: JSON.stringify([1, 2]), isMultiple: true },
          },
          { id: 'loop', type: 'loop', config: {} },
          {
            id: 'math',
            type: 'math',
            config: { operation: 'add', operand: '10' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'provider' },
          { id: 'e2', source: 'provider', target: 'loop' },
          { id: 'e3', source: 'loop', target: 'math', sourceHandle: 'item' },
          { id: 'e4', source: 'loop', target: 'end' },
        ],
      },
    };

    const context = await engine.execute(workflow);

    expect(context.status).toBe('completed');
    expect(context.steps['loop'].data).toEqual(['11', '12']);
    expect(context.steps['math'].data).toBe('12'); // Last iteration result
  });

  it("should resolve variable from direct inputData using 'input' keyword", async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test',
        name: 't',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'n1', type: 'staticInput', config: { inputValue: 'Val' } },
          {
            id: 'n2',
            type: 'staticInput',
            config: { inputValue: 'Got {{steps.input.data}}' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'n1' },
          { id: 'e2', source: 'n1', target: 'n2' },
          { id: 'e3', source: 'n2', target: 'end' },
        ],
      },
    };
    const context = await engine.execute(workflow);
    expect(context.steps['n2'].data).toBe('Got Val');
  });

  it('should abort mid-branch execution', async () => {
    NodeRegistry.register('slowBranchNode', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'done';
    });

    const workflow: WorkflowJSON = {
      meta: {
        id: 'loop-abort-wf',
        name: 'Loop Abort',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          {
            id: 'provider',
            type: 'staticInput',
            config: { inputValue: JSON.stringify([1]), isMultiple: true },
          },
          { id: 'loop', type: 'loop', config: {} },
          { id: 'slow', type: 'slowBranchNode', config: {} },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'provider' },
          { id: 'e2', source: 'provider', target: 'loop' },
          { id: 'e3', source: 'loop', target: 'slow', sourceHandle: 'item' },
          { id: 'e4', source: 'loop', target: 'end' },
        ],
      },
    };

    const promise = engine.execute(workflow);
    setTimeout(() => engine.abort(), 100);

    await expect(promise).rejects.toThrow('Workflow aborted');
  });

  it('should handle unknown variable property and warn', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test',
        name: 't',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'n1', type: 'staticInput', config: { inputValue: 'Val' } },
          {
            id: 'n2',
            type: 'staticInput',
            config: { inputValue: '{{steps.n1.unknown}}' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'n1' },
          { id: 'e2', source: 'n1', target: 'n2' },
          { id: 'e3', source: 'n2', target: 'end' },
        ],
      },
    };
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const context = await engine.execute(workflow);
    expect(context.steps['n2'].data).toBe('{{steps.n1.unknown}}');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Unknown property "unknown"')
    );
    consoleSpy.mockRestore();
  });

  it('should abort mid-node execution', async () => {
    NodeRegistry.register('slowNode', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return 'done';
    });

    const workflow: WorkflowJSON = {
      meta: {
        id: 'test',
        name: 't',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'slowNode', type: 'slowNode', config: {} },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'slowNode' },
          { id: 'e2', source: 'slowNode', target: 'end' },
        ],
      },
    };

    const promise = engine.execute(workflow);
    setTimeout(() => engine.abort(), 50);

    await expect(promise).rejects.toThrow('Workflow aborted');
    expect(engine.getContext().status).toBe('failed');
  });

  it('should resolve status and property variables', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 't1',
        name: 't',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'n1', type: 'staticInput', config: { inputValue: 'V' } },
          {
            id: 'n2',
            type: 'staticInput',
            config: { inputValue: '{{steps.n1.status}}' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'n1' },
          { id: 'e2', source: 'n1', target: 'n2' },
          { id: 'e3', source: 'n2', target: 'end' },
        ],
      },
    };
    const c1 = await engine.execute(workflow);
    expect(c1.steps['n2'].data).toBe('success');
  });

  it('should warn on unknown node reference', async () => {
    const workflow: WorkflowJSON = {
      meta: {
        id: 'test',
        name: 't',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          {
            id: 'n1',
            type: 'staticInput',
            config: { inputValue: 'Hi {{steps.missing.data}}' },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'n1' },
          { id: 'e2', source: 'n1', target: 'end' },
        ],
      },
    };
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    await engine.execute(workflow);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Variable reference to unknown node: missing')
    );
    consoleSpy.mockRestore();
  });

  it('should resolve variables in nested objects and arrays', async () => {
    NodeRegistry.register('configReturner', async (config) => {
      return config;
    });

    const workflow: WorkflowJSON = {
      meta: {
        id: 'nested',
        name: 'n',
        description: 'd',
        version: '1',
        allowedDomains: [],
        isWebMCP: false,
        enabled: true,
        savedAt: '2024-01-01T00:00:00.000Z',
      },
      graph: {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'n1', type: 'staticInput', config: { inputValue: 'World' } },
          {
            id: 'n2',
            type: 'configReturner',
            config: {
              nested: { key: 'Hello {{steps.n1.data}}' },
              list: ['{{steps.n1.data}}', 'other'],
            },
          },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [
          { id: 'e1', source: 'start', target: 'n1' },
          { id: 'e2', source: 'n1', target: 'n2' },
          { id: 'e3', source: 'n2', target: 'end' },
        ],
      },
    };
    const context = await engine.execute(workflow);
    expect(context.steps['n2'].data).toEqual(
      expect.objectContaining({
        nested: { key: 'Hello World' },
        list: ['World', 'other'],
      })
    );
  });
});
