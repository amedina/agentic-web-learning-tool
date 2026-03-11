# Rewriter API — Advanced Patterns

## Table of Contents
1. [Progressive Enhancement](#progressive-enhancement)
2. [React Integration](#react-integration)
3. [Error Handling](#error-handling)
4. [UI Patterns](#ui-patterns)
5. [Rewriter Lifecycle Management](#rewriter-lifecycle-management)

---

## Progressive Enhancement

Always treat the Rewriter API as an enhancement — your app must work without it:

```js
async function setupRewritingAssistant(containerEl) {
  if (!('Rewriter' in self)) {
    // Hide AI features entirely — browser doesn't support it
    containerEl.querySelector('.ai-rewrite-btn').hidden = true;
    return;
  }

  const availability = await Rewriter.availability({ outputLanguage: 'en' });
  if (availability === 'unavailable') {
    // Hardware requirements not met
    containerEl.querySelector('.ai-rewrite-btn').hidden = true;
    return;
  }

  // API is available — wire up the feature
  containerEl.querySelector('.ai-rewrite-btn').addEventListener('click', async () => {
    const rewriter = await Rewriter.create({ tone: 'more-casual', format: 'as-is', outputLanguage: 'en' });
    // ... use rewriter
    rewriter.destroy();
  });
}
```

---

## React Integration

### Hook for rewriter lifecycle

```jsx
import { useState, useEffect, useRef, useCallback } from 'react';

function useRewriter(options = {}) {
  const rewriterRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!('Rewriter' in self)) {
        setError('Rewriter API not supported in this browser.');
        return;
      }

      const availability = await Rewriter.availability(options);
      if (availability === 'unavailable') {
        setError('Rewriter API unavailable: hardware requirements not met.');
        return;
      }

      try {
        rewriterRef.current = await Rewriter.create({
          ...options,
          monitor(m) {
            m.addEventListener('downloadprogress', e => {
              if (!cancelled) setDownloadProgress(Math.round(e.loaded * 100));
            });
          },
        });
        if (!cancelled) {
          setIsReady(true);
          setDownloadProgress(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    init();
    return () => {
      cancelled = true;
      rewriterRef.current?.destroy();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const rewrite = useCallback(async (text, context) => {
    if (!rewriterRef.current) throw new Error('Rewriter not ready');
    return rewriterRef.current.rewrite(text, context ? { context } : undefined);
  }, []);

  const rewriteStreaming = useCallback((text, context) => {
    if (!rewriterRef.current) throw new Error('Rewriter not ready');
    return rewriterRef.current.rewriteStreaming(text, context ? { context } : undefined);
  }, []);

  return { isReady, downloadProgress, error, rewrite, rewriteStreaming };
}
```

### Streaming output component

```jsx
function RewritingAssistant({ originalText }) {
  const { isReady, downloadProgress, error, rewriteStreaming } = useRewriter({
    tone: 'more-formal',
    format: 'markdown',
    length: 'longer',
    outputLanguage: 'en',
  });
  const [output, setOutput] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const controllerRef = useRef(null);

  async function handleRewrite() {
    setOutput('');
    setIsRewriting(true);
    controllerRef.current = new AbortController();

    try {
      const stream = rewriteStreaming(originalText);
      for await (const chunk of stream) {
        setOutput(prev => prev + chunk);
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    } finally {
      setIsRewriting(false);
    }
  }

  function handleStop() {
    controllerRef.current?.abort();
  }

  if (error) return <p className="error">{error}</p>;
  if (downloadProgress !== null) return <p>Downloading model: {downloadProgress}%</p>;
  if (!isReady) return <p>Initializing rewriter…</p>;

  return (
    <div>
      <p><strong>Original:</strong> {originalText}</p>
      <button onClick={handleRewrite} disabled={isRewriting}>Rewrite</button>
      {isRewriting && <button onClick={handleStop}>Stop</button>}
      <div className="output"><strong>Revised:</strong> {output}</div>
    </div>
  );
}
```

---

## Error Handling

### Robust rewrite wrapper

```js
async function safeRewrite(text, options = {}) {
  if (!('Rewriter' in self)) {
    throw new Error('Rewriter API not supported');
  }

  const availability = await Rewriter.availability(options);
  if (availability === 'unavailable') {
    throw new Error('Rewriter API unavailable on this device');
  }

  let rewriter;
  try {
    rewriter = await Rewriter.create(options);
    return await rewriter.rewrite(text);
  } catch (err) {
    if (err.name === 'AbortError') {
      return null; // User cancelled — not an error
    }
    if (err.name === 'NotSupportedError') {
      throw new Error('Requested language combination not supported');
    }
    throw err; // Re-throw unexpected errors
  } finally {
    rewriter?.destroy();
  }
}
```

### Handling language support errors

```js
async function rewriteInLanguage(text, outputLanguage) {
  try {
    const rewriter = await Rewriter.create({
      outputLanguage,
      expectedInputLanguages: ['en'],
    });
    const result = await rewriter.rewrite(text);
    rewriter.destroy();
    return result;
  } catch (err) {
    if (err.name === 'NotSupportedError') {
      console.warn(`Language '${outputLanguage}' not supported, falling back to default`);
      // Fall back to default language check
      const fallbackOptions = { outputLanguage: 'en' };
      const availability = await Rewriter.availability(fallbackOptions);
      if (availability === 'unavailable') throw new Error('Fallback language unavailable');
      const rewriter = await Rewriter.create(fallbackOptions);
      const result = await rewriter.rewrite(text);
      rewriter.destroy();
      return result;
    }
    throw err;
  }
}
```

---

## UI Patterns

### Download progress indicator

```js
async function createRewriterWithUI(options, progressEl) {
  const availability = await Rewriter.availability(options);

  if (availability === 'available') {
    progressEl.hidden = true;
    return Rewriter.create(options);
  }

  progressEl.hidden = false;
  progressEl.textContent = 'Preparing AI model…';

  return Rewriter.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', e => {
        const pct = Math.round(e.loaded * 100);
        progressEl.textContent = `Downloading AI model: ${pct}%`;
        if (pct === 100) progressEl.textContent = 'Finalizing…';
      });
    },
  });
}
```

### Textarea with AI rewrite button

```html
<div class="compose-area">
  <textarea id="text-input" placeholder="Enter text to revise…"></textarea>
  <div class="toolbar">
    <button id="rewrite-btn">✨ Rewrite with AI</button>
    <button id="stop-btn" hidden>Stop</button>
  </div>
  <div id="output" class="output-area"></div>
  <div id="progress" hidden></div>
</div>
```

```js
const inputEl = document.getElementById('text-input');
const outputEl = document.getElementById('output');
const rewriteBtn = document.getElementById('rewrite-btn');
const stopBtn = document.getElementById('stop-btn');
const progressEl = document.getElementById('progress');

let controller;

rewriteBtn.addEventListener('click', async () => {
  const originalText = inputEl.value.trim();
  if (!originalText) return;

  controller = new AbortController();
  rewriteBtn.disabled = true;
  stopBtn.hidden = false;
  outputEl.textContent = '';

  try {
    const rewriter = await createRewriterWithUI(
      { tone: 'more-formal', format: 'as-is', outputLanguage: 'en', signal: controller.signal },
      progressEl
    );

    const stream = rewriter.rewriteStreaming(originalText, { signal: controller.signal });
    for await (const chunk of stream) {
      outputEl.textContent += chunk;
    }
    rewriter.destroy();
  } catch (err) {
    if (err.name !== 'AbortError') {
      outputEl.textContent = `Error: ${err.message}`;
    }
  } finally {
    rewriteBtn.disabled = false;
    stopBtn.hidden = true;
    progressEl.hidden = true;
  }
});

stopBtn.addEventListener('click', () => controller?.abort());
```

---

## Rewriter Lifecycle Management

### Singleton rewriter (reuse across calls)

For apps that revise content frequently, keep a single rewriter alive rather than creating/destroying per call:

```js
class RewriterService {
  #rewriter = null;
  #options;

  constructor(options = {}) {
    this.#options = options;
  }

  async #getRewriter() {
    if (this.#rewriter) return this.#rewriter;

    if (!('Rewriter' in self)) throw new Error('Rewriter API not supported');

    const availability = await Rewriter.availability(this.#options);
    if (availability === 'unavailable') throw new Error('Rewriter API unavailable');

    this.#rewriter = await Rewriter.create(this.#options);
    return this.#rewriter;
  }

  async rewrite(text, context) {
    const rewriter = await this.#getRewriter();
    return rewriter.rewrite(text, context ? { context } : undefined);
  }

  rewriteStreaming(text, context) {
    // Note: returns a promise of an async iterable
    return this.#getRewriter().then(rewriter =>
      rewriter.rewriteStreaming(text, context ? { context } : undefined)
    );
  }

  destroy() {
    this.#rewriter?.destroy();
    this.#rewriter = null;
  }
}

// Usage
const rewriterService = new RewriterService({ tone: 'more-formal', format: 'as-is', outputLanguage: 'en' });

// Reuse across multiple calls
const rewrite1 = await rewriterService.rewrite('Send me the doc.');
const rewrite2 = await rewriterService.rewrite('I hated that meeting.');

// Clean up when done
rewriterService.destroy();
```
