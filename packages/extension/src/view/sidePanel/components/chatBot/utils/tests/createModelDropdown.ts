/**
 * Internal dependencies
 */
import { INITIAL_PROVIDERS } from '../../../../../../constants';
import createModelDropdown from '../createModelDropdown';

describe('createModelDropdown', () => {
  // Define mock API keys
  const mockApiKeys: any = {
    'open-ai': { provider: 'open-ai', apiKey: 'sk-123', status: true },
    anthropic: { apiKey: 'sk-ant', status: false, provider: 'anthropic' },
  };

  it('should include providers with status: true and valid models', () => {
    const result = createModelDropdown(mockApiKeys);

    // Should find OpenAI
    const openAIEntry = result.find((p) => p.id === 'open-ai');
    expect(openAIEntry).toBeDefined();
    expect(openAIEntry?.label).toBe('OpenAI');
    expect(openAIEntry?.items[0].submenu).toHaveLength(33);
  });

  it('should always include "browser-ai" regardless of API keys input', () => {
    // Passing empty object
    const result = createModelDropdown({});

    const browserAiEntry = result.find((p) => p.id === 'browser-ai');
    expect(browserAiEntry).toBeDefined();
    expect(browserAiEntry?.label).toBe('Browser AI');
    expect(browserAiEntry?.items[0].submenu).toHaveLength(1);
  });

  it('should filter out providers where status is false', () => {
    const result = createModelDropdown(mockApiKeys);

    // Anthropic is in INITIAL_PROVIDERS but status is false in mockApiKeys
    const anthropicEntry = result.find((p) => p.id === 'anthropic');
    expect(anthropicEntry).toBeUndefined();
  });

  it('should filter out providers that have empty submenus/models', () => {
    const result = createModelDropdown(mockApiKeys);

    // 'empty-models-provider' has status: true, but models: [] in INITIAL_PROVIDERS
    const emptyEntry = result.find((p) => p.id === 'empty-models-provider');
    expect(emptyEntry).toBeUndefined();
  });

  it('should return the correct data structure for the dropdown', () => {
    // Test with just one active provider for clarity
    const input = { ['open-ai']: { apiKey: '123', status: true } };
    const result = createModelDropdown(input);

    // Expected structure for OpenAI based on the Mock
    const expectedOpenAI = [
      {
        id: 'open-ai',
        label: 'OpenAI',
        hideLabel: true,
        group: 'open-ai',
        items: [
          {
            id: 'open-ai',
            label: 'OpenAI',
            mainLabel: 'Models',
            submenu: [...INITIAL_PROVIDERS[2].models],
          },
        ],
      },
      {
        id: 'browser-ai',
        label: 'Browser AI',
        hideLabel: true,
        group: 'browser-ai',
        items: [
          {
            id: 'browser-ai',
            label: 'Browser AI',
            mainLabel: 'Models',
            submenu: [...INITIAL_PROVIDERS[0].models],
          },
        ],
      },
    ];

    expect(result).toStrictEqual(expectedOpenAI);
  });

  it('should handle providers that exist in API keys but not in INITIAL_PROVIDERS gracefully', () => {
    // 'unknown-provider' is in input, but not in the mock constant
    const result = createModelDropdown(mockApiKeys);

    // It should map to undefined/default values during map,
    // and likely be filtered out because models/submenu will be undefined or empty
    const unknownEntry = result.find((p) => p.id === 'unknown-provider');
    expect(unknownEntry).toBeUndefined();
  });
});
