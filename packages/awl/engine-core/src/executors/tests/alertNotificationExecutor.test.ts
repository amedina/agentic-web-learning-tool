/**
 * Internal dependencies
 */
import { alertNotificationExecutor } from '../alertNotificationExecutor';
import type { RuntimeInterface } from '../../runtime';
import type { ExecutionContext } from '../../types';

describe('alertNotificationExecutor', () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      showAlert: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it('should show alert with formatted input by default', async () => {
    const config = { input: 'Hello' };
    const result = await alertNotificationExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.showAlert).toHaveBeenCalledWith('Hello');
    expect(result).toBe('Hello');
  });

  it('should show alert with custom message if configured', async () => {
    const config = {
      input: 'Data',
      useCustomMessage: true,
      message: 'Custom Msg',
    };
    const result = await alertNotificationExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.showAlert).toHaveBeenCalledWith('Custom Msg');
    expect(result).toBe('Custom Msg');
  });

  it('should show placeholder if custom message is empty', async () => {
    const config = { input: 'Data', useCustomMessage: true, message: '' };
    const result = await alertNotificationExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.showAlert).toHaveBeenCalledWith('No message provided');
    expect(result).toBe('No message provided');
  });

  it('should use title as fallback if input is empty', async () => {
    const config = { input: '', title: 'My Title' };
    const result = await alertNotificationExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.showAlert).toHaveBeenCalledWith('My Title');
    expect(result).toBe('My Title');
  });
});
