# Testing Translator API Code

When an agent writes code that uses the built-in Chrome Translator API, it is important to test that the logic is correct. Because the Translator API relies on `self.Translator` and `self.LanguageDetector` which are exclusively available natively in Chrome browsers with the built-in AI enabled, automated testing in standard environments (like Node.js or basic Headless Chrome without flags) poses a challenge.

Agents should follow these strategies to test the generated code:

## 1. Mocking the API for Unit Tests

In your unit testing environment (e.g., Jest, Vitest), you should mock the `Translator` and `LanguageDetector` globals.

### Mocking Translator

```javascript
// Mocking the Translator API on the global object
global.Translator = {
  availability: vi.fn().mockResolvedValue('available'),
  create: vi.fn().mockImplementation(async (options) => {
    // Optionally trigger the monitor download progress event
    if (options && options.monitor) {
      const mockMonitor = {
        addEventListener: (event, callback) => {
          if (event === 'downloadprogress') {
            callback({ loaded: 100, total: 100 });
          }
        }
      };
      options.monitor(mockMonitor);
    }

    return {
      translate: vi.fn().mockImplementation(async (text) => {
        return `[Mock Translated to ${options.targetLanguage}]: ${text}`;
      }),
      translateStreaming: vi.fn().mockImplementation(async function* (text) {
        yield `[Mock`;
        yield ` Translated to ${options.targetLanguage}]: `;
        yield text;
      })
    };
  })
};
```

### Mocking LanguageDetector

```javascript
// Mocking the Language Detector API on the global object
global.LanguageDetector = {
  availability: vi.fn().mockResolvedValue('available'),
  create: vi.fn().mockImplementation(async (options) => {
    return {
      detect: vi.fn().mockResolvedValue([
        { detectedLanguage: 'es', confidence: 0.98 },
        { detectedLanguage: 'fr', confidence: 0.02 }
      ])
    };
  })
};
```

## 2. Testing Error Handling & Fallbacks

Ensure you write tests to cover the failure cases:
- `availability()` returning `'unavailable'` (unsupported languages).
- `Translator.create()` failing due to a failed download.
- `LanguageDetector.detect()` failing to identify a language confidently.

You can achieve this by changing the mock responses in your test cases:

```javascript
test('handles unsupported translation', async () => {
  global.Translator.availability.mockResolvedValueOnce('unavailable');

  await expect(translateUnknownText('hello', 'xyz'))
    .rejects.toThrow('Translation from en to xyz not supported.');
});
```

## 3. End-to-End Testing

For true End-to-End testing, you need a Chromium browser with the Built-in AI flags enabled. Tools like Puppeteer or Playwright can launch Chrome with specific flags if you point them to a compatible Canary or Dev channel build.

The flags required generally include:
- `--enable-features=TranslatorAPI,LanguageDetectionAPI`
- Or configuring `chrome://flags/#translation-api`

*Note: Since these APIs are experimental, rely primarily on mock-based unit tests for standard CI/CD pipelines unless an environment specifically provisions Chrome with the required AI flags.*
