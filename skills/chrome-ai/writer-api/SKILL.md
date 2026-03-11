---
name: Writer API
description: >
  Guide for writing code that uses Chrome's built-in Writer API (on-device content generation with Gemini Nano in the browser).
  Use this skill whenever the user wants to generate new written content in the browser using on-device AI, use the Writer API, draft emails/blog posts/reviews/support requests with browser AI, stream writing output in real-time, configure writing tone/format/length, write content in multiple languages on-device, or reuse a writer for batch content generation.
  Trigger this skill for any mention of: Writer API, Writer.create, writer.write, writeStreaming, on-device writing, browser writing AI, chrome built-in writer, writing assistance API, draft generation, or content generation with Gemini Nano.
tags:
  - chrome
  - ai
  - writer-api
---

# Writer API

The Writer API lets you generate new written content on-device using Gemini Nano in Chrome — no backend or API key required. It's part of Chrome's built-in AI suite and pairs with the [Rewriter API](https://developer.chrome.com/docs/ai/rewriter) for editing existing content.

## Quick-start pattern

```js
// 1. Feature detect
if (!('Writer' in self)) {
  console.warn('Writer API not supported');
  return;
}

// 2. Check availability — pass the same options you'll use in create()
const availability = await Writer.availability({ outputLanguage: 'en' });
// 'available' | 'downloadable' | 'downloading' | 'unavailable'

// 3. Create writer (with optional download monitor)
const writer = await Writer.create({
  tone: 'neutral',       // 'formal' | 'neutral' (default) | 'casual'
  format: 'markdown',    // 'markdown' (default) | 'plain-text'
  length: 'medium',      // 'short' (default) | 'medium' | 'long'
  outputLanguage: 'en',  // Required — omitting causes a Chrome console warning
  sharedContext: 'Optional context shared across all write() calls.',
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 4. Write content
const result = await writer.write('Draft a professional email requesting a meeting.');

// 5. Clean up
writer.destroy();
```

## Availability check pattern

Always check availability before creating a writer. Handle all four states:

```js
async function createWriter(options = {}) {
  if (!('Writer' in self)) return null;

  // Pass the same options to availability() to check support upfront
  const availability = await Writer.availability(options);

  if (availability === 'unavailable') {
    // Hardware requirements not met — don't proceed
    return null;
  }

  if (availability === 'available') {
    // Model already downloaded — create immediately
    return await Writer.create(options);
  }

  // 'downloadable' or 'downloading' — trigger download with progress
  return await Writer.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', e => {
        const pct = Math.round(e.loaded * 100);
        console.log(`Downloading model: ${pct}%`);
        // Update your UI progress indicator here
      });
    },
  });
}
```

## Configuration options

| Option | Values | Default | Notes |
|--------|--------|---------|-------|
| `tone` | `'formal'`, `'neutral'`, `'casual'` | `'neutral'` | Style/attitude of output |
| `format` | `'markdown'`, `'plain-text'` | `'markdown'` | Output formatting |
| `length` | `'short'`, `'medium'`, `'long'` | `'short'` | Approximate output length |
| `sharedContext` | string | — | Background context for all writes in this session |
| `expectedInputLanguages` | string[] (BCP 47) | — | Languages the prompts will be in |
| `expectedContextLanguages` | string[] (BCP 47) | — | Languages the context will be in |
| `outputLanguage` | string (BCP 47) | **Required** | Language for generated output. Omitting causes a Chrome console warning. Always pass to both `availability()` and `create()`. |
| `signal` | `AbortSignal` | — | For cancellation |

## Writing modes

### Non-streaming (request-based)

Use when you need the complete output before displaying it:

```js
const writer = await Writer.create({ tone: 'formal', format: 'plain-text', outputLanguage: 'en' });

const result = await writer.write(
  'An inquiry to my bank about enabling wire transfers.',
  { context: "I'm a longstanding customer since 2010." }
);

console.log(result);
writer.destroy();
```

### Streaming

Use for real-time output — better perceived performance for longer content:

```js
const writer = await Writer.create({ tone: 'casual', format: 'markdown', length: 'long', outputLanguage: 'en' });

const stream = writer.writeStreaming(
  'Write a blog post about the benefits of on-device AI.',
  { context: 'Target audience: web developers.' }
);

const outputEl = document.getElementById('output');
for await (const chunk of stream) {
  outputEl.textContent += chunk;
}

writer.destroy();
```

## Multiple writes with shared context

Reuse a single writer for batch generation — more efficient than creating a new writer per task:

```js
const writer = await Writer.create({
  tone: 'formal',
  format: 'plain-text',
  outputLanguage: 'en',
  sharedContext: 'These are product reviews for an e-commerce platform. Keep them concise and helpful.',
});

// Batch generate reviews for multiple products
const reviewEls = document.querySelectorAll('.product-description');
const reviews = await Promise.all(
  Array.from(reviewEls, el => writer.write(el.textContent))
);

writer.destroy();
```

## Multilingual writing

Specify expected languages to let the browser validate support before proceeding:

```js
const writer = await Writer.create({
  tone: 'formal',
  expectedInputLanguages: ['en', 'ja', 'es'],
  expectedContextLanguages: ['en'],
  outputLanguage: 'es',
  sharedContext: 'These are messages to teachers in a Spanish language program.',
});

const result = await writer.write(
  'Write a message asking about homework due dates.',
  { context: 'Student is a beginner Spanish learner.' }
);
```

## Cancellation

Use `AbortController` to cancel in-progress writes or destroy the writer:

```js
const controller = new AbortController();

// Wire up a stop button
document.getElementById('stop-btn').onclick = () => controller.abort();

const writer = await Writer.create({ signal: controller.signal });

try {
  const stream = writer.writeStreaming(prompt, { signal: controller.signal });
  for await (const chunk of stream) {
    outputEl.textContent += chunk;
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Writing cancelled by user.');
  }
} finally {
  writer.destroy();
}
```

## iframes and Permission Policy

The Writer API is available to top-level windows and same-origin iframes by default. To grant access to cross-origin iframes:

```html
<iframe src="https://cross-origin.example.com/" allow="writer"></iframe>
```

> **Note:** The Writer API is **not** available in Web Workers.

## Hardware requirements

The Writer API requires Gemini Nano, which has these minimum requirements:
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus). Not supported on mobile.
- **Storage**: 22 GB free space on the Chrome profile volume.
- **GPU**: >4 GB VRAM, **or** CPU with ≥16 GB RAM and ≥4 cores.
- **Network**: Unmetered connection for initial model download.

## Origin trial setup

The Writer API is in a joint origin trial with the Rewriter API (Chrome 137–148):

1. Accept [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy)
2. Register at the [Writer API origin trial](https://developer.chrome.com/origintrials#/view_trial/-8779204523605360639)
3. Add the token to your page or extension manifest

**For localhost development**, enable these Chrome flags:
- `chrome://flags/#optimization-guide-on-device-model` → **Enabled**
- `chrome://flags/#writer-api-for-gemini-nano` → **Enabled**

## Common patterns

### Email drafting assistant

```js
async function draftEmail(subject, userContext) {
  const writer = await Writer.create({
    tone: 'formal',
    format: 'plain-text',
    length: 'medium',
    outputLanguage: 'en',
    sharedContext: 'Professional business email drafts.',
  });

  const draft = await writer.write(subject, { context: userContext });
  writer.destroy();
  return draft;
}
```

### Streaming blog post generator

```js
async function generateBlogPost(topic, outputEl) {
  const availability = await Writer.availability({ outputLanguage: 'en' });
  if (availability === 'unavailable') {
    outputEl.textContent = 'Writer API not available on this device.';
    return;
  }

  const writer = await Writer.create({
    tone: 'casual',
    format: 'markdown',
    length: 'long',
    outputLanguage: 'en',
  });

  outputEl.textContent = '';
  const stream = writer.writeStreaming(`Write a blog post about: ${topic}`);
  for await (const chunk of stream) {
    outputEl.textContent += chunk;
  }

  writer.destroy();
}
```

### Support request helper

```js
async function improveSupportRequest(userInput) {
  const writer = await Writer.create({
    tone: 'neutral',
    format: 'plain-text',
    length: 'short',
    outputLanguage: 'en',
    sharedContext: 'Help users write clear, actionable support requests.',
  });

  const improved = await writer.write(
    `Rewrite this support request to be clearer: "${userInput}"`
  );

  writer.destroy();
  return improved;
}
```

## Reference

For deeper coverage, read:
- [reference/patterns.md](reference/patterns.md) — Advanced patterns: React integration, error handling, progressive enhancement, and UI patterns
