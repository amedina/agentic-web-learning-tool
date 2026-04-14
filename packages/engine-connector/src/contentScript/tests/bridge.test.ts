/**
 * Internal dependencies
 */
import { initContentScriptBridge } from '../bridge';

describe('ContentScriptBridge', () => {
  let handleMsg: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chrome API
    (global as any).chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn((cb) => {
            handleMsg = cb;
          }),
        },
        sendMessage: jest.fn().mockResolvedValue({}),
        query: jest.fn(),
      },
      tabs: {
        query: jest.fn(),
      },
    };

    // Mock window APIs
    (window as any).alert = jest.fn();
    (window as any).SpeechSynthesisUtterance = jest.fn();
    (window as any).speechSynthesis = {
      speak: jest.fn(),
    };
    (document as any).execCommand = jest.fn();

    // Mock URL.createObjectURL and revokeObjectURL
    (global as any).URL.createObjectURL = jest.fn(() => 'mock-url');
    (global as any).URL.revokeObjectURL = jest.fn();

    initContentScriptBridge();
  });

  afterEach(() => {
    delete (global as any).chrome;
    document.body.innerHTML = '';
  });

  it('should initialize and listen for messages', () => {
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    expect(handleMsg).toBeDefined();
  });

  describe('QUERY_DOM', () => {
    it('should extract textContent from an element', () => {
      document.body.innerHTML = '<div class="test">Hello World</div>';
      const sendResponse = jest.fn();

      handleMsg(
        {
          type: 'QUERY_DOM',
          selector: '.test',
          extract: 'textContent',
        },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: 'Hello World',
      });
    });

    it('should extract multiple elements', () => {
      document.body.innerHTML = '<span>A</span><span>B</span>';
      const sendResponse = jest.fn();

      handleMsg(
        {
          type: 'QUERY_DOM',
          selector: 'span',
          extract: 'textContent',
          isMultiple: true,
        },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: ['A', 'B'],
      });
    });

    it('should return empty if no elements found', () => {
      const sendResponse = jest.fn();
      handleMsg(
        {
          type: 'QUERY_DOM',
          selector: '.missing',
          extract: 'textContent',
        },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: '',
      });
    });

    it('should handle extraction error', () => {
      const sendResponse = jest.fn();
      // Invalid selector to trigger error
      handleMsg(
        {
          type: 'QUERY_DOM',
          selector: '::invalid',
          extract: 'textContent',
        },
        {},
        sendResponse
      );

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });
  });

  describe('UPDATE_NODE_STATUS', () => {
    it('should log node status', () => {
      const sendResponse = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      handleMsg(
        { type: 'UPDATE_NODE_STATUS', nodeId: 'n1', status: 'success' },
        {},
        sendResponse
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node n1: success')
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      consoleSpy.mockRestore();
    });
  });

  describe('CONTENT_SCRIPT_ACTIVE', () => {
    it('should return success if tab is found', async () => {
      const sendResponse = jest.fn();
      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 1 }]);
      await handleMsg(
        { type: 'CONTENT_SCRIPT_ACTIVE', targetTabId: 1 },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should return false if tab is not found', async () => {
      const sendResponse = jest.fn();
      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 2 }]);
      await handleMsg(
        { type: 'CONTENT_SCRIPT_ACTIVE', targetTabId: 1 },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: false });
    });
  });

  describe('SHOW_ALERT', () => {
    it('should call window.alert', () => {
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'SHOW_ALERT', message: 'test alert' },
        {},
        sendResponse
      );
      expect(window.alert).toHaveBeenCalledWith('test alert');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle error if alert fails', () => {
      const sendResponse = jest.fn();
      (window as any).alert.mockImplementation(() => {
        throw new Error('Alert failed');
      });
      handleMsg(
        { type: 'SHOW_ALERT', message: 'test alert' },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Alert failed'),
        })
      );
    });
  });

  describe('REPLACE_DOM', () => {
    it('should replace content of a single element', () => {
      document.body.innerHTML = '<div id="target">Old</div>';
      const sendResponse = jest.fn();
      handleMsg(
        {
          type: 'REPLACE_DOM',
          selector: '#target',
          content: 'New',
        },
        {},
        sendResponse
      );

      expect(document.getElementById('target')?.textContent).toBe('New');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should replace by index', () => {
      document.body.innerHTML = '<p>1</p><p>2</p>';
      const sendResponse = jest.fn();
      handleMsg(
        {
          type: 'REPLACE_DOM',
          selector: 'p',
          content: 'Updated',
          index: 1,
        },
        {},
        sendResponse
      );

      const ps = document.querySelectorAll('p');
      expect(ps[0].textContent).toBe('1');
      expect(ps[1].textContent).toBe('Updated');
    });

    it('should replace all if isMultiple is true', () => {
      document.body.innerHTML = '<span>1</span><span>2</span>';
      const sendResponse = jest.fn();
      handleMsg(
        {
          type: 'REPLACE_DOM',
          selector: 'span',
          content: 'All',
          isMultiple: true,
        },
        {},
        sendResponse
      );

      const spans = document.querySelectorAll('span');
      expect(spans[0].textContent).toBe('All');
      expect(spans[1].textContent).toBe('All');
    });

    it('should throw error if element not found', () => {
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'REPLACE_DOM', selector: '.missing', content: 'c' },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('No element found'),
        })
      );
    });

    it('should throw error if element at index not found', () => {
      document.body.innerHTML = '<p>1</p>';
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'REPLACE_DOM', selector: 'p', content: 'c', index: 5 },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('No element found at index 5'),
        })
      );
    });

    it('should throw error if multiple elements not found', () => {
      const sendResponse = jest.fn();
      handleMsg(
        {
          type: 'REPLACE_DOM',
          selector: '.missing',
          content: 'c',
          isMultiple: true,
        },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('No elements found'),
        })
      );
    });
  });

  describe('Other Messages', () => {
    it('should handle COPY_TO_CLIPBOARD', () => {
      const sendResponse = jest.fn();
      handleMsg({ type: 'COPY_TO_CLIPBOARD', text: 'clip' }, {}, sendResponse);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle SPEAK_TEXT', () => {
      const sendResponse = jest.fn();
      handleMsg({ type: 'SPEAK_TEXT', text: 'hello' }, {}, sendResponse);
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle DOWNLOAD_FILE', () => {
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'DOWNLOAD_FILE', filename: 't.txt', content: 'c' },
        {},
        sendResponse
      );
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle SHOW_TOOLTIP', () => {
      document.body.innerHTML = '<div id="tip-target">Target</div>';
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'SHOW_TOOLTIP', selector: '#tip-target', content: 'tip info' },
        {},
        sendResponse
      );

      // Should add a style tag and a tooltip div
      expect(document.getElementById('awlt-tooltip-styles')).not.toBeNull();
      expect(document.body.textContent).toContain('tip info');
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('should handle error in COPY_TO_CLIPBOARD', () => {
      const sendResponse = jest.fn();
      (document as any).execCommand.mockImplementation(() => {
        throw new Error('Copy error');
      });
      handleMsg({ type: 'COPY_TO_CLIPBOARD', text: 'clip' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Copy error'),
        })
      );
    });

    it('should handle SPEAK_TEXT error', () => {
      const sendResponse = jest.fn();
      (window.speechSynthesis.speak as jest.Mock).mockImplementation(() => {
        throw new Error('Speak error');
      });
      handleMsg({ type: 'SPEAK_TEXT', text: 'hello' }, {}, sendResponse);
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('Speak error'),
        })
      );
    });

    it('should handle DOWNLOAD_FILE error', () => {
      const sendResponse = jest.fn();
      (global.URL.createObjectURL as jest.Mock).mockImplementation(() => {
        throw new Error('URL error');
      });
      handleMsg(
        { type: 'DOWNLOAD_FILE', filename: 't.txt', content: 'c' },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('URL error'),
        })
      );
    });

    it('should handle SHOW_TOOLTIP error (no element)', () => {
      const sendResponse = jest.fn();
      handleMsg(
        { type: 'SHOW_TOOLTIP', selector: '.missing', content: 'tip info' },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('No elements found'),
        })
      );
    });

    it('should handle SHOW_TOOLTIP unexpected error', () => {
      document.body.innerHTML = '<div id="target"></div>';
      const sendResponse = jest.fn();
      jest.spyOn(document, 'querySelectorAll').mockImplementation(() => {
        throw new Error('Iter error');
      });
      handleMsg(
        { type: 'SHOW_TOOLTIP', selector: '#target', content: 'tip info' },
        {},
        sendResponse
      );
      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Iter error' })
      );
      (document.querySelectorAll as jest.Mock).mockRestore();
    });
  });
});
