/**
 * Internal dependencies
 */
import { rewriterApiExecutor } from '../rewriterApiExecutor';
import type { RuntimeInterface } from '../../runtime';
import type { ExecutionContext } from '../../types';

describe('rewriterApiExecutor', () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).Rewriter = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).Rewriter;
  });

  it('should rewrite content with all options', async () => {
    const config = {
      input: 'original',
      sharedContext: 'ctx',
      tone: 'casual',
      length: 'short',
      format: 'plain-text',
      expectedInputLanguages: ['en'],
      outputLanguage: 'en',
    };

    const mockRewriter = { rewrite: jest.fn().mockResolvedValue('rewritten') };
    (global as any).Rewriter.create.mockResolvedValue(mockRewriter);

    const result = await rewriterApiExecutor(config, mockRuntime, mockContext);

    expect(result).toBe('rewritten');
    expect((global as any).Rewriter.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedContext: 'ctx',
        tone: 'casual',
        length: 'short',
        format: 'plain-text',
        expectedInputLanguages: ['en'],
        outputLanguage: 'en',
      })
    );
  });

  it('should throw error if input is missing', async () => {
    await expect(
      rewriterApiExecutor({ input: '' }, mockRuntime, mockContext)
    ).rejects.toThrow('requires input text');
  });

  it('should handle API failure', async () => {
    (global as any).Rewriter.create.mockRejectedValue(new Error('Fail'));
    await expect(
      rewriterApiExecutor({ input: 'text' }, mockRuntime, mockContext)
    ).rejects.toThrow('Rewriter API execution failed');
  });
});
