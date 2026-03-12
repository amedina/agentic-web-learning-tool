---
name: Summarizer API
description: >
  Guide for writing code that uses Chrome's built-in Summarizer API (on-device AI for generating summaries with Gemini Nano).
  Use this skill whenever the user wants to distill lengthy articles, chat conversations, or complex documents into concise and insightful summaries in the browser without a backend. It should trigger when asked to create a summary, suggest titles or headings, generate a teaser for an article, write a TL;DR, or extract key points using on-device AI.
  Trigger this skill for any mention of: Summarizer API, Summarizer.create, summarizer.summarize, summarizeStreaming, on-device summarization, browser summarization AI, chrome built-in summarizer, tldr generation, key points extraction, or teaser generation with Gemini Nano.
tags:
  - chrome
  - ai
  - summarizer-api
---

# Summarizer API

The Summarizer API lets you generate different types of summaries (sentences, paragraphs, bullet points) in varied lengths and formats on-device using Gemini Nano in Chrome — no backend or API key required. It's part of Chrome's built-in AI suite.

## Quick-start pattern

```js
// 1. Feature detect
if (!('Summarizer' in self)) {
  console.warn('Summarizer API not supported');
  return;
}

// 2. Check availability — pass the same options you'll use in create()
const availability = await Summarizer.availability({ outputLanguage: 'en' });
// 'available' | 'downloadable' | 'downloading' | 'unavailable'

// 3. Create summarizer (with optional download monitor and options)
// Wait for user activation before calling create() if download is required
const summarizer = await Summarizer.create({
  type: 'key-points',      // 'key-points' (default) | 'tldr' | 'teaser' | 'headline'
  format: 'markdown',      // 'markdown' (default) | 'plain-text'
  length: 'short',         // 'short' (default) | 'medium' | 'long'
  outputLanguage: 'en',    // Required — omitting causes a Chrome console warning
  sharedContext: 'Optional background context shared across all summarize() calls.',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 4. Summarize content
const textToSummarize = "Your very long article or chat history goes here...";
const summary = await summarizer.summarize(textToSummarize, {
  context: 'Optional context specific to this summarization task.',
});

// 5. Clean up
summarizer.destroy();
```

## Availability check pattern

Always check availability before creating a summarizer. The model may need to be downloaded first.

```js
async function createSummarizer(options = {}) {
  if (!('Summarizer' in self)) return null;

  // Pass the same options to availability() to check support upfront
  const availability = await Summarizer.availability(options);

  if (availability === 'unavailable') {
    // Hardware requirements not met — don't proceed
    return null;
  }

  if (availability === 'available') {
    // Model already downloaded — create immediately
    return await Summarizer.create(options);
  }

  // 'downloadable' or 'downloading' — trigger download with progress
  // Note: Only call create() after user activation if download is required
  if (navigator.userActivation.isActive) {
    return await Summarizer.create({
      ...options,
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          const pct = Math.round(e.loaded * 100);
          console.log(`Downloading model: ${pct}%`);
        });
      },
    });
  } else {
    console.warn('User interaction required to download the summarization model.');
    return null;
  }
}
```

## Configuration options

The `create()` function takes an optional `options` object. Once set, parameters cannot be changed. Create a new summarizer if you need different parameters.

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `type` | `'key-points'`, `'tldr'`, `'teaser'`, `'headline'` | `'key-points'` | The type of the summarization. |
| `format` | `'markdown'`, `'plain-text'` | `'markdown'` | Output formatting. |
| `length` | `'short'`, `'medium'`, `'long'` | `'short'` | Approximate output length. |
| `sharedContext` | string | — | Background context for all summaries in this session. |
| `expectedInputLanguages` | string[] (BCP 47) | — | Languages the input text will be in. |
| `expectedContextLanguages`| string[] (BCP 47) | — | Languages the context will be in. |
| `outputLanguage`| string (BCP 47) | **Required** | Language for generated output. Omitting causes a Chrome console warning. Always pass to both `availability()` and `create()`. |
| `signal` | `AbortSignal` | — | For cancellation of creation. |

### Summary Types and Lengths

The meaning of length varies by type (lengths represent the maximum possible value):

- **tldr** (short overview): `short` (1 sentence), `medium` (3 sentences), `long` (5 sentences)
- **teaser** (focuses on intriguing parts): `short` (1 sentence), `medium` (3 sentences), `long` (5 sentences)
- **key-points** (extracted points): `short` (3 bullets), `medium` (5 bullets), `long` (7 bullets)
- **headline** (main point in single sentence): `short` (12 words), `medium` (17 words), `long` (22 words)

## Summarization modes

### Batch summarization (Non-streaming)

Use when you need the complete summary before displaying it.

```js
const summarizer = await Summarizer.create({ type: 'tldr', length: 'medium' });

const summary = await summarizer.summarize(
  document.querySelector('article').innerHTML,
  { context: 'This article is intended for a tech-savvy audience.' }
);

console.log(summary);
summarizer.destroy();
```

### Streaming summarization

Use for real-time output — better perceived performance for longer content.

```js
const summarizer = await Summarizer.create({ type: 'key-points', length: 'long' });

const stream = summarizer.summarizeStreaming(
  document.querySelector('article').innerHTML,
  { context: 'This article is intended for junior developers.' }
);

const outputEl = document.getElementById('output');
for await (const chunk of stream) {
  outputEl.textContent += chunk;
}

summarizer.destroy();
```

> ⚠️ **IMPORTANT: Incremental Streaming** ⚠️<br>
> The `summarizeStreaming()` API yields **incremental** chunks of text. Each chunk contains only the **new** tokens, not the entire response so far. You must **append** them (`+= chunk`) to build the complete output.

## Advanced Patterns & Configurations

For advanced use cases including multilingual support, permission policies (iframes), error handling, and cancellation, please refer to the advanced patterns guide:

- [reference/patterns.md](reference/patterns.md) — Advanced patterns and edge cases.
