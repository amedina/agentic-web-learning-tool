/**
 * Potential Issues — Runtime verification tests for extension utility issues.
 *
 * These tests confirm or deny issues from docs/potential-issues.md that
 * were previously marked as NEEDS RUNTIME TEST / INCONCLUSIVE.
 */

// Mock the logger before importing settingsValidator
jest.mock('../logger', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import settingsValidator from '../settingsValidator';

// ─── 11.2 — Import settings from different extension version ─────────────────

describe('Issue 11.2: Import settings from different version', () => {
  const validConfig = {
    apiKeys: { openai: { apiKey: 'sk-test', status: true, systemPrompt: '' } },
    extensionSettings: { theme: 'dark', logLevel: 'SILENT' },
    userWebMCPTools: '[]',
    builtInToolsState: {},
    chromeAPIBuiltInToolsState: {},
    mcpConfigs: '{}',
    promptCommands: [],
    builtInPromptCommands: [],
  };

  it('settings from older version missing required keys are rejected', () => {
    const oldConfig = {
      apiKeys: { openai: { apiKey: 'sk-test' } },
      extensionSettings: { theme: 'dark' },
      // Missing: userWebMCPTools, builtInToolsState, chromeAPIBuiltInToolsState,
      //          mcpConfigs, promptCommands, builtInPromptCommands
    };

    const result = settingsValidator({ config: oldConfig } as any);
    expect(result).toBe(false);
  });

  it('settings with extra unknown keys from future version pass validation silently', () => {
    const futureConfig = {
      ...validConfig,
      unknownFutureKey: 'some value',
      anotherFutureKey: { nested: true },
    };

    const result = settingsValidator({ config: futureConfig } as any);
    // Extra keys are not checked — validation passes
    expect(result).not.toBe(false);
    // But extra keys are NOT included in the returned config
    // (since the return object only picks known keys)
    expect(result).not.toHaveProperty('unknownFutureKey');
  });

  it('malformed JSON in userWebMCPTools crashes without try-catch', () => {
    const badConfig = {
      ...validConfig,
      userWebMCPTools: 'not-valid-json',
    };

    // settingsValidator.ts line 42: JSON.parse(config.userWebMCPTools) — no try-catch
    expect(() =>
      settingsValidator({ config: badConfig } as any)
    ).toThrow();
  });

  it('malformed JSON in mcpConfigs crashes without try-catch', () => {
    const badConfig = {
      ...validConfig,
      mcpConfigs: '{broken',
    };

    // settingsValidator.ts line 43: JSON.parse(config.mcpConfigs) — no try-catch
    expect(() =>
      settingsValidator({ config: badConfig } as any)
    ).toThrow();
  });

  it('valid config returns parsed object with defaults', () => {
    const configNoTheme = {
      ...validConfig,
      extensionSettings: {},
    };

    const result = settingsValidator({ config: configNoTheme } as any);
    expect(result).not.toBe(false);
    expect((result as any).extensionSettings.theme).toBe('auto');
    expect((result as any).extensionSettings.logLevel).toBe('SILENT');
  });

  it('empty apiKeys {} passes validation (issue 11.3 related)', () => {
    const configEmptyApi = {
      ...validConfig,
      apiKeys: {},
    };

    // !config.apiKeys is false for {} — validation passes
    const result = settingsValidator({ config: configEmptyApi } as any);
    expect(result).not.toBe(false);
  });
});
