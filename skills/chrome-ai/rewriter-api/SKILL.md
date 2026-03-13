---
name: Rewriter API
description: >
  Guide for writing code that uses Chrome's built-in Rewriter API (on-device text revision with Gemini Nano in the browser).
  Use this skill whenever the user wants to revise, restructure, edit, or improve existing text natively in the browser using on-device AI.
  Trigger this skill for any mention of: Rewriter API, Rewriter.create, rewriter.rewrite, rewriteStreaming, on-device rewriting, changing tone, changing text length, browser editing AI, chrome built-in rewriter, writing assistance API, or content revision with Gemini Nano.
tags:
  - chrome
  - ai
  - rewriter-api
---

# Rewriter API

The Rewriter API helps you revise and restructure existing text on-device using Gemini Nano in Chrome — no backend or API key required. It's part of Chrome's built-in AI suite and pairs with the [Writer API](./writer-api/SKILL.md) for generating new content.

## Quick-start pattern

```js
// 1. Feature detect
if (!('Rewriter' in self)) {
  console.warn('Rewriter API not supported');
  return;
}

// 2. Check availability — pass the same options you'll use in create()
const availability = await Rewriter.availability({ outputLanguage: 'en' });
// 'available' | 'downloadable' | 'downloading' | 'unavailable'

// 3. Create rewriter (with optional download monitor)
const rewriter = await Rewriter.create({
  tone: 'as-is',         // 'as-is' (default) | 'more-formal' | 'more-casual'
  format: 'as-is',       // 'as-is' (default) | 'markdown' | 'plain-text'
  length: 'as-is',       // 'as-is' (default) | 'shorter' | 'longer'
  outputLanguage: 'en',  // Required — omitting causes a Chrome console warning
  sharedContext: 'Optional background info shared across all rewrite() calls.',
  monitor(m) {
    m.addEventListener('downloadprogress', e => {
      console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 4. Rewrite content
const originalText = 'Hey, can you send me that report when you get a chance? Thanks.';
const result = await rewriter.rewrite(originalText, {
  context: 'This is a message to a manager.', // Optional per-call context
});

// 5. Clean up
rewriter.destroy();
```

## Availability check pattern

Always check availability before creating a rewriter. Handle all four states:

> **IMPORTANT:** Always pass `outputLanguage` to `Rewriter.availability()`. Although the API accepts an empty options object, omitting language options causes Chrome to log a console warning. Always include at minimum `{ outputLanguage }` in every `availability()` call.

```js
async function createRewriter(options = {}) {
  if (!('Rewriter' in self)) return null;

  // IMPORTANT: options must include outputLanguage — omitting it causes a Chrome console warning
  const availability = await Rewriter.availability(options);

  if (availability === 'unavailable') {
    // Hardware requirements not met — don't proceed
    return null;
  }

  if (availability === 'available') {
    // Model already downloaded — create immediately
    return await Rewriter.create(options);
  }

  // 'downloadable' or 'downloading' — trigger download with progress
  return await Rewriter.create({
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
| `tone` | `'as-is'`, `'more-formal'`, `'more-casual'` | `'as-is'` | Adjust style/attitude |
| `format` | `'as-is'`, `'markdown'`, `'plain-text'` | `'as-is'` | Output formatting |
| `length` | `'as-is'`, `'shorter'`, `'longer'` | `'as-is'` | Adjust approximate length |
| `sharedContext` | string | — | Background context for all rewrites in this session |
| `expectedInputLanguages` | string[] (BCP 47) | — | Languages the input text will be in |
| `expectedContextLanguages` | string[] (BCP 47) | — | Languages the context will be in |
| `outputLanguage` | string (BCP 47) | **Required** | Language for generated output. Omitting causes a Chrome console warning. Always pass to both `availability()` and `create()`. |
| `signal` | `AbortSignal` | — | For cancellation |

## Rewriting modes

### Non-streaming (request-based)

Use when you need the complete output before displaying it:

```js
const rewriter = await Rewriter.create({ tone: 'more-formal', length: 'longer', outputLanguage: 'en' });

const result = await rewriter.rewrite(
  'The product broke after a week.',
  { context: "A customer review avoiding toxic language." }
);

console.log(result);
rewriter.destroy();
```

### Streaming

Use for real-time output — better perceived performance for longer content:

```js
const rewriter = await Rewriter.create({ tone: 'more-casual', length: 'shorter', outputLanguage: 'en' });

const stream = rewriter.rewriteStreaming(
  'I am writing to express my profound dissatisfaction with the services rendered.',
  { context: 'A chat message to a friend.' }
);

const outputEl = document.getElementById('output');
for await (const chunk of stream) {
  outputEl.textContent += chunk;
}

rewriter.destroy();
```

## Multiple rewrites with shared context

Reuse a single rewriter for batch editing — more efficient than creating a new rewriter per task:

```js
const rewriter = await Rewriter.create({
  tone: 'more-casual',
  outputLanguage: 'en',
  sharedContext: 'These are comments on an internal company message board. Keep it light.',
});

// Batch rewrite comments for a softer tone
const commentEls = document.querySelectorAll('.comment-body');
const rewrites = await Promise.all(
  Array.from(commentEls, el => rewriter.rewrite(el.textContent, {
    context: 'Ensure the feedback is constructive.'
  }))
);

rewriter.destroy();
```

## Multilingual rewriting

Specify expected languages to let the browser validate support before proceeding:

```js
const rewriter = await Rewriter.create({
  tone: 'more-formal',
  expectedInputLanguages: ['en', 'ja', 'es'],
  expectedContextLanguages: ['en'],
  outputLanguage: 'es',
  sharedContext: 'These are messages to teachers in a Spanish language program.',
});

const result = await rewriter.rewrite(
  'Can I turn in the assignment late?',
  { context: 'Student is asking for an extension.' }
);
```

## Cancellation

Use `AbortController` to cancel in-progress rewrites or destroy the rewriter:

```js
const controller = new AbortController();

// Wire up a stop button
document.getElementById('stop-btn').onclick = () => controller.abort();

const rewriter = await Rewriter.create({ outputLanguage: 'en', signal: controller.signal });

try {
  const stream = rewriter.rewriteStreaming(originalText, { signal: controller.signal });
  for await (const chunk of stream) {
    outputEl.textContent += chunk;
  }
} catch (err) {
  if (err.name === 'AbortError') {
    console.log('Rewriting cancelled by user.');
  }
} finally {
  rewriter.destroy();
}
```

## iframes and Permission Policy

The Rewriter API is available to top-level windows and same-origin iframes by default. To grant access to cross-origin iframes:

```html
<iframe src="https://cross-origin.example.com/" allow="rewriter"></iframe>
```

> **Note:** The Rewriter API is **not** available in Web Workers.

## Hardware requirements

The Rewriter API requires Gemini Nano, which has these minimum requirements:
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus). Not supported on mobile.
- **Storage**: 22 GB free space on the Chrome profile volume.
- **GPU**: >4 GB VRAM, **or** CPU with ≥16 GB RAM and ≥4 cores.
- **Network**: Unmetered connection for initial model download.

## Origin trial setup

The Rewriter API is in a joint origin trial with the Writer API (Chrome 137–148):

1. Accept [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy)
2. Register at the [Rewriter API origin trial](https://developer.chrome.com/origintrials#/view_trial/444167513249415169)
3. Add the token to your page or extension manifest

**For localhost development**, enable these Chrome flags:
- `chrome://flags/#optimization-guide-on-device-model` → **Enabled**
- `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled** or **Enabled Multilingual**
- `chrome://flags/#writer-api-for-gemini-nano` → **Enabled** or **Enabled Multilingual**

## Reference

For deeper coverage, read:
- [reference/patterns.md](reference/patterns.md) — Advanced patterns: React integration, error handling, progressive enhancement, and UI patterns
