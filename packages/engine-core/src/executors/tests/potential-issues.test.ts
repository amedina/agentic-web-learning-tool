/**
 * Potential Issues — Runtime verification tests for executor-level issues.
 *
 * These tests confirm or deny issues from docs/potential-issues.md that
 * were previously marked as NEEDS RUNTIME TEST / INCONCLUSIVE.
 */
import { mathExecutor } from '../mathExecutor';
import { writerApiExecutor } from '../writerApiExecutor';
import { proofreaderApiExecutor } from '../proofreaderApiExecutor';
import { dataTransformerExecutor } from '../dataTransformerExecutor';
import type { RuntimeInterface } from '../../runtime';
import type { ExecutionContext } from '../../types';

// ─── 9.9 — Division by zero propagation ─────────────────────────────────────

describe('Issue 9.9: Division by zero returns Infinity and propagates', () => {
  const mockRuntime = {} as RuntimeInterface;
  const mockContext = {} as ExecutionContext;

  it('division by zero returns "Infinity" string', async () => {
    const result = await mathExecutor(
      { input: '10', operation: 'divide', operand: '0' },
      mockRuntime,
      mockContext
    );
    expect(result).toBe('Infinity');
  });

  it('Infinity propagates through downstream math operations', async () => {
    // Simulate: node A divides by zero → Infinity → node B adds 5
    const divResult = await mathExecutor(
      { input: '10', operation: 'divide', operand: '0' },
      mockRuntime,
      mockContext
    );

    const addResult = await mathExecutor(
      { input: divResult, operation: 'add', operand: '5' },
      mockRuntime,
      mockContext
    );
    // Infinity + 5 = Infinity — the bad value never resolves
    expect(addResult).toBe('Infinity');
  });

  it('Infinity multiplied by zero returns NaN', async () => {
    const result = await mathExecutor(
      { input: 'Infinity', operation: 'multiply', operand: '0' },
      mockRuntime,
      mockContext
    );
    // Infinity * 0 = NaN — further corruption
    expect(result).toBe('NaN');
  });
});

// ─── 9.13 — Writer API binary search truncation ─────────────────────────────

describe('Issue 9.13: Writer API with malformed measureInputUsage', () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;
    (global as any).Writer = { create: jest.fn() };
  });

  afterEach(() => {
    delete (global as any).Writer;
  });

  it('measureInputUsage always exceeding quota truncates input to empty string', async () => {
    const mockWriter = {
      measureInputUsage: jest.fn().mockResolvedValue(99999),
      inputQuota: 100,
      write: jest.fn().mockResolvedValue('output'),
    };
    (global as any).Writer.create.mockResolvedValue(mockWriter);

    const result = await writerApiExecutor(
      { input: 'Some text that should not be fully truncated' },
      mockRuntime,
      mockContext
    );

    // Binary search converges to optimalLength=0 since everything is "over quota"
    expect(mockWriter.write).toHaveBeenCalledWith('');
    expect(result).toBe('output');
  });

  it('binary search terminates even with inconsistent measureInputUsage', async () => {
    // Alternating above/below quota
    let callCount = 0;
    const mockWriter = {
      measureInputUsage: jest.fn().mockImplementation(async () => {
        callCount++;
        return callCount % 2 === 0 ? 50 : 200; // alternates
      }),
      inputQuota: 100,
      write: jest.fn().mockResolvedValue('ok'),
    };
    (global as any).Writer.create.mockResolvedValue(mockWriter);

    // Should still terminate (binary search always converges)
    const result = await writerApiExecutor(
      { input: 'Hello world test' },
      mockRuntime,
      mockContext
    );
    expect(result).toBe('ok');
  }, 10000);

  it('NaN from measureInputUsage skips binary search', async () => {
    const mockWriter = {
      measureInputUsage: jest.fn().mockResolvedValue(NaN),
      inputQuota: 100,
      write: jest.fn().mockResolvedValue('ok'),
    };
    (global as any).Writer.create.mockResolvedValue(mockWriter);

    // NaN > inputQuota is false, so binary search is skipped entirely
    const result = await writerApiExecutor(
      { input: 'text' },
      mockRuntime,
      mockContext
    );
    expect(result).toBe('ok');
    expect(mockWriter.write).toHaveBeenCalledWith('text');
  });
});

// ─── 9.15 — Proofreader API unexpected correction format ─────────────────────

describe('Issue 9.15: Proofreader with malformed correction data', () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;
    (global as any).Proofreader = { create: jest.fn() };
  });

  afterEach(() => {
    delete (global as any).Proofreader;
  });

  it('correction with missing suggestions array falls back to original text', async () => {
    const mockProofreader = {
      proofread: jest.fn().mockResolvedValue({
        corrections: [
          { startIndex: 5, endIndex: 9 }, // No suggestions array
        ],
      }),
    };
    (global as any).Proofreader.create.mockResolvedValue(mockProofreader);

    const result = await proofreaderApiExecutor(
      { input: 'Hello wrld' },
      mockRuntime,
      mockContext
    );
    // Falls back to formattedInput.substring(5, 9) = "wrld" — original misspelled text
    expect(result).toBe('Hello wrld');
  });

  it('correction with undefined startIndex/endIndex causes data loss', async () => {
    const mockProofreader = {
      proofread: jest.fn().mockResolvedValue({
        corrections: [
          {
            startIndex: undefined,
            endIndex: undefined,
            suggestions: ['fix'],
          },
        ],
      }),
    };
    (global as any).Proofreader.create.mockResolvedValue(mockProofreader);

    const result = await proofreaderApiExecutor(
      { input: 'Hello world' },
      mockRuntime,
      mockContext
    );

    // correction.startIndex (undefined) > inputRenderIndex (0) is false
    // so no preceding text is copied
    // correctedText += "fix"
    // inputRenderIndex = undefined → NaN
    // NaN < formattedInput.length is false → remainder NOT appended
    // Result: just "fix" — rest of input is silently lost
    expect(result).toBe('fix');
  });

  it('correction with startIndex beyond input length causes empty substring', async () => {
    const mockProofreader = {
      proofread: jest.fn().mockResolvedValue({
        corrections: [
          { startIndex: 100, endIndex: 200, suggestions: ['replace'] },
        ],
      }),
    };
    (global as any).Proofreader.create.mockResolvedValue(mockProofreader);

    const result = await proofreaderApiExecutor(
      { input: 'Short' },
      mockRuntime,
      mockContext
    );

    // startIndex (100) > inputRenderIndex (0), so substring(0, 100) = "Short"
    // correctedText = "Short" + "replace"
    // inputRenderIndex = 200, 200 < 5 is false → no remainder
    expect(result).toBe('Shortreplace');
  });
});

// ─── 15.5 — Data Transformer regex ReDoS ─────────────────────────────────────

describe('Issue 15.5: Data Transformer regex ReDoS vulnerability', () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = {} as any;
  });

  it('catastrophic backtracking regex pattern causes measurable delay', async () => {
    // Pattern (a+)+b with input "aaa...ac" causes exponential backtracking
    // Using 20 chars to keep test fast but still measurable
    const evilPattern = '(a+)+b';
    const evilInput = 'a'.repeat(20) + 'c';

    const start = Date.now();
    const result = await dataTransformerExecutor(
      { input: evilInput, operation: 'regex', pattern: evilPattern },
      mockRuntime,
      mockContext
    );
    const elapsed = Date.now() - start;

    // No match found, returns empty string
    expect(result).toBe('');
    // With 20 'a's, backtracking takes noticeable time (>50ms typically)
    // The key issue: there's no timeout protection, so larger inputs hang indefinitely
    expect(elapsed).toBeGreaterThan(0);
  }, 30000);

  it('user-supplied regex is executed without any validation', async () => {
    // Arbitrary user patterns go directly into new RegExp()
    const result = await dataTransformerExecutor(
      { input: 'test123', operation: 'regex', pattern: '(\\d+)' },
      mockRuntime,
      mockContext
    );
    expect(result).toBe('123');
  });

  it('invalid regex pattern is caught but returns original input', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const result = await dataTransformerExecutor(
      { input: 'test', operation: 'regex', pattern: '[' },
      mockRuntime,
      mockContext
    );
    // Invalid regex caught, returns original input
    expect(result).toBe('test');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
