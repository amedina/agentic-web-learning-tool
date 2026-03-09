# Proofreader API Patterns

Advanced integration patterns for the Proofreader API.

## Table of Contents
- [React Integration](#react-integration)
- [Cancellation with AbortSignal](#cancellation-with-abortsignal)
- [Progressive Enhancement](#progressive-enhancement)
- [Multi-language Proofreading](#multi-language-proofreading)

---

## React Integration

A robust hook for interacting with the Proofreader API within a React component. It handles the initial availability checks, creation, execution, state, and cleanup automatically.

```tsx
import { useState, useEffect, useRef } from 'react';

export function useProofreader() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'downloading' | 'ready' | 'error' | 'unavailable'
  const [progress, setProgress] = useState(0);
  const proofreaderRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function init() {
      if (!('Proofreader' in self)) {
        setStatus('unavailable');
        return;
      }

      try {
        const availability = await self.Proofreader.availability();

        if (availability === 'unavailable') {
          setStatus('unavailable');
          return;
        }

        if (!active) return;

        proofreaderRef.current = await self.Proofreader.create({
          expectedInputLanguages: ['en'],
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              if (active) {
                setStatus('downloading');
                setProgress(Math.round(e.loaded * 100));
              }
            });
          },
        });

        if (active) setStatus('ready');
      } catch (err) {
        console.error('Proofreader initialization failed:', err);
        if (active) setStatus('error');
      }
    }

    init();

    return () => {
      active = false;
      if (proofreaderRef.current) {
        proofreaderRef.current.destroy();
      }
    };
  }, []);

  const proofreadText = async (text) => {
    if (!proofreaderRef.current) throw new Error('Proofreader not ready');
    return await proofreaderRef.current.proofread(text);
  };

  return { status, progress, proofreadText };
}

// Example usage in a component
export function ProofreaderDemo() {
  const { status, progress, proofreadText } = useProofreader();
  const [input, setInput] = useState('');
  const [correction, setCorrection] = useState(null);

  const handleCheck = async () => {
    const result = await proofreadText(input);
    setCorrection(result);
  };

  if (status === 'unavailable') return <div>Proofreader not supported.</div>;
  if (status === 'downloading') return <div>Downloading AI Model: {progress}%</div>;

  return (
    <div>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <button disabled={status !== 'ready' || !input} onClick={handleCheck}>
        Check Grammar
      </button>

      {correction && (
        <div>
          <h3>Corrected Text:</h3>
          <p>{correction.correction}</p>
        </div>
      )}
    </div>
  );
}
```

## Cancellation with AbortSignal

In a real-world scenario, you might want to stop proofreading or downloading the model if a user navigates away or clears the text before processing finishes.

```js
class ProofreadingManager {
  constructor() {
    this.controller = null;
    this.proofreader = null;
  }

  async check(text) {
    // Abort previous run if exists
    if (this.controller) {
      this.controller.abort();
    }

    this.controller = new AbortController();

    try {
      if (!this.proofreader) {
        this.proofreader = await Proofreader.create({
          signal: this.controller.signal,
        });
      }

      const result = await this.proofreader.proofread(text);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Proofreading was cancelled.');
      } else {
        throw err;
      }
    }
  }

  cancel() {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  cleanup() {
    this.cancel();
    if (this.proofreader) {
      this.proofreader.destroy();
      this.proofreader = null;
    }
  }
}
```

## Progressive Enhancement

You should degrade gracefully if the Proofreader API is unsupported or fails to load.

```html
<form id="comment-form">
  <textarea id="comment" required></textarea>
  <button type="submit">Submit Comment</button>
  <button type="button" id="proofread-btn" hidden>Fix Grammar</button>
  <div id="correction-display" aria-live="polite"></div>
</form>

<script>
  (async () => {
    const proofreadBtn = document.getElementById('proofread-btn');
    const display = document.getElementById('correction-display');
    const input = document.getElementById('comment');

    // Feature detect and unhide the button
    if ('Proofreader' in self) {
      const availability = await Proofreader.availability();
      if (availability !== 'unavailable') {
        proofreadBtn.hidden = false;

        let proofreader;
        proofreadBtn.addEventListener('click', async () => {
          proofreadBtn.disabled = true;
          proofreadBtn.textContent = 'Checking...';

          try {
            if (!proofreader) {
                proofreader = await Proofreader.create();
            }
            const result = await proofreader.proofread(input.value);
            display.textContent = `Did you mean: "${result.correction}"?`;
          } catch (e) {
             display.textContent = 'Error checking grammar.';
          } finally {
             proofreadBtn.disabled = false;
             proofreadBtn.textContent = 'Fix Grammar';
          }
        });
      }
    }
  })();
</script>
```

## Multi-language Proofreading

Use the `expectedInputLanguages` option with BCP-47 tags (e.g., `'es'`, `'fr'`) to specify supported languages for proofreading. Note that Chrome's underlying model support for these languages may vary based on versions.

```js
async function initializeMultiLingualProofreader() {
  const supportedLanguages = ['en', 'es', 'fr'];

  const proofreader = await Proofreader.create({
    expectedInputLanguages: supportedLanguages
  });

  return proofreader;
}
```
