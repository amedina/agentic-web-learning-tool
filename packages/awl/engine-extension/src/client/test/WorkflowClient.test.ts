/**
 * Internal dependencies
 */
import { WorkflowClient, getWorkflowClient } from '../WorkflowClient';

describe('WorkflowClient', () => {
  let client: WorkflowClient;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).chrome = {
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn(),
        },
        lastError: null,
      },
    };

    client = new WorkflowClient();
  });

  afterEach(() => {
    delete (global as any).chrome;
  });

  it('should send RUN_WORKFLOW message and handle callbacks', async () => {
    const wf = { meta: { id: '1' } } as any;
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      context: { status: 'completed' },
    });

    const result = await client.runWorkflow(wf, 123, { onComplete: jest.fn() });
    expect(result).toEqual({ status: 'completed' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'RUN_WORKFLOW',
      workflow: wf,
      tabId: 123,
    });
  });

  it('should handle error in runWorkflow', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false,
      error: 'failed',
    });
    await expect(client.runWorkflow({} as any)).rejects.toThrow('failed');

    (chrome.runtime as any).lastError = { message: 'comm error' };
    await expect(client.runWorkflow({} as any)).rejects.toThrow('comm error');
  });

  it('should handle error in checkCapabilities', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false,
      error: 'cap failed',
    });
    await expect(client.checkCapabilities(['a'])).rejects.toThrow('cap failed');

    (chrome.runtime as any).lastError = { message: 'comm error' };
    await expect(client.checkCapabilities(['a'])).rejects.toThrow('comm error');
  });

  it('should send CHECK_CAPABILITIES message', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      results: { a: true },
    });
    const results = await client.checkCapabilities(['a']);
    expect(results).toEqual({ a: true });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'CHECK_CAPABILITIES',
      capabilities: ['a'],
    });
  });

  it('should send STOP_WORKFLOW message', async () => {
    await client.stopWorkflow();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'STOP_WORKFLOW',
    });
  });

  describe('Event Listening', () => {
    let handleMsg: any;

    beforeEach(() => {
      client.setCallbacks({ onNodeStart: jest.fn() });
      handleMsg = (chrome.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
    });

    it('should trigger onNodeStart for running status', () => {
      const callbacks: any = { onNodeStart: jest.fn() };
      client.setCallbacks(callbacks);
      handleMsg({
        type: 'NODE_STATUS',
        nodeId: 'n1',
        output: { status: 'running' },
      });
      expect(callbacks.onNodeStart).toHaveBeenCalledWith('n1');
    });

    it('should trigger onNodeFinish for other statuses', () => {
      const callbacks: any = { onNodeFinish: jest.fn() };
      client.setCallbacks(callbacks);
      handleMsg({
        type: 'NODE_STATUS',
        nodeId: 'n1',
        output: { status: 'success' },
      });
      expect(callbacks.onNodeFinish).toHaveBeenCalledWith('n1', {
        status: 'success',
      });
    });

    it('should trigger onComplete', () => {
      const callbacks: any = { onComplete: jest.fn() };
      client.setCallbacks(callbacks);
      handleMsg({ type: 'WORKFLOW_COMPLETE', context: { status: 'done' } });
      expect(callbacks.onComplete).toHaveBeenCalledWith({ status: 'done' });
    });

    it('should trigger onError', () => {
      const callbacks: any = { onError: jest.fn() };
      client.setCallbacks(callbacks);
      handleMsg({ type: 'WORKFLOW_ERROR', error: 'oops' });
      expect(callbacks.onError).toHaveBeenCalledWith('oops');
    });
  });

  it('should maintain singleton instance', () => {
    const c1 = getWorkflowClient();
    const c2 = getWorkflowClient();
    expect(c1).toBe(c2);
  });
});
