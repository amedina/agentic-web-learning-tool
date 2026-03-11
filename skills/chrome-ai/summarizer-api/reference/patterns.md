# Summarizer API Advanced Patterns

This reference file covers advanced configuration and usage patterns for the Chrome Built-in AI Summarizer API.

## Multilingual summarization

The Summarizer API supports multiple languages. By setting the expected input, output, and context languages when creating your session, the browser can reject the request early if it doesn't support a specific language combination.

```js
const summarizer = await Summarizer.create({
  type: 'key-points',
  expectedInputLanguages: ['en', 'ja', 'es'],
  outputLanguage: 'es',
  expectedContextLanguages: ['en'],
  sharedContext: 'These are requests to summarize articles from a multilanguage newspaper. The users expect a response in Spanish.',
});

// If the browser supports this language combination, summarizer is created.
const summary = await summarizer.summarize("Your article content here...");
```

## Batch Summarization with Shared Context

Reuse a single summarizer object for batch processing multiple items — this is much more efficient than creating a new summarizer for each task.

```js
const summarizer = await Summarizer.create({
  type: 'tldr',
  length: 'short',
  sharedContext: 'Provide short summaries for user reviews of a technical product.',
});

// Batch generate summaries for multiple reviews
const reviewEls = document.querySelectorAll('.review-body');
const summaries = await Promise.all(
  Array.from(reviewEls, el => summarizer.summarize(el.textContent))
);

summarizer.destroy();
```

## Cancellation

Use an `AbortController` to cancel in-progress creation or summarization operations.

```js
const controller = new AbortController();

// Wire up a stop button
document.getElementById('stop-btn').onclick = () => controller.abort();

const summarizer = await Summarizer.create({ signal: controller.signal });

try {
  const stream = summarizer.summarizeStreaming(longText, {
    signal: controller.signal
  });

  for await (const chunk of stream) {
    outputEl.textContent = chunk; // Update UI continuously
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Summarization cancelled by user.');
  } else {
    console.error('An error occurred:', err);
  }
} finally {
  if (summarizer) summarizer.destroy();
}
```

## iframes and Permission Policy

The Summarizer API is available to top-level windows and same-origin iframes by default. Access to the API can be delegated to cross-origin iframes using the Permission Policy `allow=""` attribute:

```html
<!--
  The hosting site at https://main.example.com can grant a cross-origin iframe
  at https://cross-origin.example.com/ access to the Summarizer API by
  setting the `allow="summarizer"` attribute.
-->
<iframe src="https://cross-origin.example.com/" allow="summarizer"></iframe>
```

> **Note:** The Summarizer API is **not** available in Web Workers for now. This is due to the complexity of establishing a responsible document for each worker, in order to check the Permissions Policy status.

## Hardware requirements

The Summarizer API uses a built-in model (Gemini Nano) to generate high-quality summaries. The requirements are:
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus). Mobile devices are not supported yet.
- **Storage**: At least 22 GB free space on the Chrome profile volume.
- **GPU**: Strictly more than 4 GB VRAM, **or** CPU with ≥16 GB RAM and ≥4 cores.
- **Network**: Unlimited data or an unmetered connection for the initial model download.

To check model sizes and internals, visit `chrome://on-device-internals`.

## Common UI Pattern: Summarization Widget

```js
async function attachSummarizer(buttonEl, contentEl, resultEl) {
  // Feature detect
  if (!('Summarizer' in self)) {
    buttonEl.disabled = true;
    buttonEl.title = "Summarizer API not supported";
    return;
  }

  buttonEl.addEventListener('click', async () => {
    buttonEl.disabled = true;
    resultEl.textContent = 'Preparing...';

    const availability = await Summarizer.availability({ outputLanguage: 'en' });
    if (availability === 'unavailable') {
      resultEl.textContent = 'Summarization not available on this device.';
      return;
    }

    try {
      const summarizer = await Summarizer.create({
        type: 'key-points',
        length: 'medium',
        outputLanguage: 'en',
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const pct = Math.round(e.loaded * 100);
            resultEl.textContent = `Downloading AI model: ${pct}%...`;
          });
        }
      });

      resultEl.textContent = 'Summarizing...';
      const stream = summarizer.summarizeStreaming(contentEl.textContent);

      for await (const chunk of stream) {
        resultEl.textContent = chunk;
      }

      summarizer.destroy();
    } catch (e) {
      resultEl.textContent = `Error: ${e.message}`;
    } finally {
      buttonEl.disabled = false;
    }
  });
}
```