/**
 * Internal dependencies
 */
import { staticInputExecutor } from '../staticInputExecutor';
import type { RuntimeInterface } from '../../runtime';
import type { ExecutionContext } from '../../types';

describe('staticInputExecutor', () => {
  const mockRuntime = {} as RuntimeInterface;
  const mockContext = {} as ExecutionContext;

  it('should return a string value when isMultiple is false', async () => {
    const config = {
      inputValue: 'Hello World',
      isMultiple: false,
    };
    const result = await staticInputExecutor(config, mockRuntime, mockContext);
    expect(result).toBe('Hello World');
  });

  it('should return an empty string if inputValue is missing and isMultiple is false', async () => {
    const config = {
      isMultiple: false,
    };
    const result = await staticInputExecutor(
      config as any,
      mockRuntime,
      mockContext
    );
    expect(result).toBe('');
  });

  it('should return a parsed array when isMultiple is true and input is a valid JSON array', async () => {
    const config = {
      inputValue: '["a", "b", "c"]',
      isMultiple: true,
    };
    const result = await staticInputExecutor(config, mockRuntime, mockContext);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should wrap single value in array if isMultiple is true and input is NOT an array', async () => {
    const config = {
      inputValue: 'single value',
      isMultiple: true,
    };
    const result = await staticInputExecutor(config, mockRuntime, mockContext);
    expect(result).toEqual(['single value']);
  });

  it('should handle mixed types in JSON array when isMultiple is true', async () => {
    const config = {
      inputValue: '[1, "two", true]',
      isMultiple: true,
    };
    const result = await staticInputExecutor(config, mockRuntime, mockContext);
    expect(result).toEqual([1, 'two', true]);
  });
});
