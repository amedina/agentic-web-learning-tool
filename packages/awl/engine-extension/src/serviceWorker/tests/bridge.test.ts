/**
 * Internal dependencies
 */
import { initServiceWorkerBridge } from '../bridge';
import { getWorkflowRunner } from '../runner';
import { initContentScriptBridge } from '../../contentScript';

jest.mock('./runner');
jest.mock('../contentScript');

describe('WorkflowBridge', () => {
  let mockRunner: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRunner = {
      run: jest.fn().mockResolvedValue({ status: 'completed' }),
      stop: jest.fn(),
      checkCapabilities: jest.fn().mockResolvedValue({ cap1: true }),
    };
    (getWorkflowRunner as jest.Mock).mockReturnValue(mockRunner);

    (global as any).chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn(),
        },
        sendMessage: jest.fn().mockResolvedValue({}),
      },
      tabs: {
        sendMessage: jest.fn(),
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue({}),
      },
    };
  });

  afterEach(() => {
    delete (global as any).chrome;
  });

  it('should initialize by adding a message listener', () => {
    initServiceWorkerBridge();
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  describe('handleMessage', () => {
    let handleMsg: any;

    beforeEach(() => {
      initServiceWorkerBridge();
      handleMsg = (chrome.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
    });

    it('should handle RUN_WORKFLOW', async () => {
      const sendResponse = jest.fn();
      const message = { type: 'RUN_WORKFLOW', workflow: {}, tabId: 1 };

      // Mock successful injection check
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = handleMsg(message, {}, sendResponse);
      expect(result).toBe(true);

      // Wait for async handleRunWorkflow to complete
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockRunner.run).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should handle STOP_WORKFLOW', () => {
      const sendResponse = jest.fn();
      const result = handleMsg({ type: 'STOP_WORKFLOW' }, {}, sendResponse);
      expect(result).toBe(true);
      expect(mockRunner.stop).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle CHECK_CAPABILITIES', async () => {
      const sendResponse = jest.fn();
      const result = handleMsg(
        { type: 'CHECK_CAPABILITIES', capabilities: ['c1'] },
        {},
        sendResponse
      );
      expect(result).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockRunner.checkCapabilities).toHaveBeenCalledWith(['c1']);
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        results: { cap1: true },
      });
    });

    it('should return false and error for unknown message type', () => {
      const sendResponse = jest.fn();
      const result = handleMsg({ type: 'UNKNOWN' }, {}, sendResponse);
      expect(result).toBe(false);
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Unknown message type',
      });
    });
  });

  describe('handleRunWorkflow Specifics', () => {
    let handleMsg: any;

    beforeEach(() => {
      initServiceWorkerBridge();
      handleMsg = (chrome.runtime.onMessage.addListener as jest.Mock).mock
        .calls[0][0];
    });

    it('should inject content script if not active', async () => {
      const sendResponse = jest.fn();
      (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(
        new Error('inactive')
      );

      handleMsg(
        { type: 'RUN_WORKFLOW', workflow: {}, tabId: 1 },
        {},
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 1 },
          func: initContentScriptBridge,
        })
      );
    });

    it('should broadcast NODE_STATUS during execution', async () => {
      const sendResponse = jest.fn();
      let registeredCallbacks: any;
      mockRunner.run.mockImplementation((wf: any, tid: any, cb: any) => {
        registeredCallbacks = cb;
        return Promise.resolve({ status: 'completed' });
      });

      handleMsg(
        { type: 'RUN_WORKFLOW', workflow: {}, tabId: 1 },
        {},
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Trigger callbacks
      registeredCallbacks.onNodeStart('n1');
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'NODE_STATUS',
        nodeId: 'n1',
        output: { status: 'running' },
      });

      registeredCallbacks.onNodeFinish('n1', { status: 'success', data: 'ok' });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'NODE_STATUS',
        nodeId: 'n1',
        output: { status: 'success', data: 'ok' },
      });
    });

    it('should broadcast WORKFLOW_ERROR and WORKFLOW_COMPLETE', async () => {
      const sendResponse = jest.fn();
      let registeredCallbacks: any;
      mockRunner.run.mockImplementation((wf: any, tid: any, cb: any) => {
        registeredCallbacks = cb;
        return Promise.resolve({ status: 'completed' });
      });

      handleMsg(
        { type: 'RUN_WORKFLOW', workflow: {}, tabId: 1 },
        {},
        sendResponse
      );
      await new Promise((resolve) => setTimeout(resolve, 0));

      registeredCallbacks.onError(new Error('fatal'));
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_ERROR',
        error: 'fatal',
      });

      // After run resolves
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'WORKFLOW_COMPLETE',
        context: { status: 'completed' },
      });
    });
  });
});
