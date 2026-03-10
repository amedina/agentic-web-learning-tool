---
name: Prompt API
description: >
  Guide for writing code that uses Chrome's built-in Prompt API (window.LanguageModel / Gemini Nano in the browser).
  Use this skill whenever the user wants to run on-device AI inference in the browser, use the Prompt API, prompt Gemini Nano locally, build AI-powered browser features without a backend, do streaming text generation in the browser, use multimodal inputs (image/audio) with a browser AI model, constrain model output with JSON Schema, or manage language model sessions in a Chrome extension or web page.
  Trigger this skill for any mention of: LanguageModel, Gemini Nano, on-device AI, browser AI, chrome built-in AI, Prompt API, promptStreaming, or in-browser LLM.
tags:
  - chrome
  - ai
  - prompt-api
  - gemini-nano
  - on-device
  - browser-ai
---

# Prompt API — Development Guide

> **When to use the Prompt API?** Use this for open-ended queries, multi-turn chat, multimodal inputs (image/audio), and JSON-constrained output. If you specifically need to generate new long-form text, rewrite existing text, or summarize content, use the purpose-built **Writer API**, **Rewriter API**, or **Summarizer API** instead.

## Overview

The Prompt API gives web pages and Chrome Extensions direct access to **Gemini Nano**, Google's on-device language model built into Chrome. No API keys, no network round-trips, no backend — inference runs locally on the user's device.

Key capabilities:
- Text generation (streaming and non-streaming)
- Multimodal inputs: text, images, audio
- Structured output via JSON Schema constraints
- Multi-turn conversations with session context
- Session cloning, restoration, and lifecycle management

> **Hardware requirements**: Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus). Needs >4 GB VRAM (GPU) or 16 GB RAM + 4 CPU cores. At least 22 GB free storage. Unmetered network connection for initial model download. Not supported on mobile.

---

## Quick Start

```js
// 1. Check availability
const available = await LanguageModel.availability();
if (available === 'unavailable') return;

// 2. Create a session (triggers model download if needed)
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 3. Prompt the model
const result = await session.prompt('Summarize this in one sentence: ...');
console.log(result);

// 4. Clean up
session.destroy();
```

---

## Checking Availability

Always check availability before creating a session. The `LanguageModel.availability()` method returns one of:

| Value | Meaning |
|---|---|
| `"available"` | Model is ready to use immediately |
| `"downloading"` | Model is being downloaded — listen for progress |
| `"downloadable"` | Model can be downloaded on demand |
| `"unavailable"` | Device doesn't meet requirements |

```js
const availability = await LanguageModel.availability({
  // Optionally pass the same options you'll use in create()
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

if (availability === 'unavailable') {
  // Show fallback UI or disable the feature
  return;
}

if (availability === 'downloading') {
  // Inform the user — download may take a while
}
```

---

## Creating a Session

`LanguageModel.create()` initializes a session. Sessions hold conversation context and model configuration.

> **Note on model download:** Calling `create()` may trigger the model download if it hasn't been downloaded yet. To ensure the download is successful, call `create()` after a **user activation** gesture (like a button click) rather than immediately on page load.

### Basic session

```js
const session = await LanguageModel.create();
```

### With custom parameters

```js
const params = await LanguageModel.params();
// params: { defaultTopK, maxTopK, defaultTemperature, maxTemperature }

const session = await LanguageModel.create({
  temperature: params.defaultTemperature,  // Controls randomness (0–maxTemperature)
  topK: params.defaultTopK,               // Controls diversity of token selection
});
```

> You must set **both** `temperature` and `topK`, or neither.

### With a system prompt and conversation history

Use `initialPrompts` to give the model context — a system persona, prior conversation turns, or few-shot examples:

```js
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a concise, helpful assistant.' },
    { role: 'user', content: 'What is the capital of France?' },
    { role: 'assistant', content: 'Paris.' },
  ],
});
```

### With expected input/output modalities

Declare what types of inputs and outputs your session will use. This is required for multimodal sessions:

```js
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
    { type: 'audio' },
  ],
  expectedOutputs: [
    { type: 'text', languages: ['en'] },
  ],
});
```

Supported input types: `"text"`, `"image"`, `"audio"`. Output type: `"text"` only.
Supported languages for text: `"en"`, `"ja"`, `"es"` (more in development).

### With abort support

```js
const controller = new AbortController();
cancelButton.onclick = () => controller.abort();

const session = await LanguageModel.create({ signal: controller.signal });
```

---

## Prompting the Model

### Non-streaming (short responses)

```js
const result = await session.prompt('Write a haiku about the ocean.');
console.log(result);
```

### Streaming (long responses)

Use `promptStreaming()` to display output progressively. Returns a `ReadableStream`:

```js
const stream = session.promptStreaming('Write a detailed essay about climate change.');
for await (const chunk of stream) {
  outputElement.textContent = chunk; // Each chunk is the full text so far
}
```

> ⚠️ **WARNING: Cumulative streaming chunks** ⚠️<br>
> Unlike some other APIs where you append chunks (`textContent += chunk`), the `promptStreaming()` API yields **cumulative** chunks. Each `chunk` contains the entire response up to that point, not just the new tokens. You must **overwrite** the text content on each iteration (`textContent = chunk`).

### Stop a prompt mid-generation

```js
const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const result = await session.prompt('Tell me a very long story...', {
  signal: controller.signal,
});
```

### Multi-turn conversation

Sessions automatically maintain context across calls:

```js
const session = await LanguageModel.create();
const reply1 = await session.prompt('My name is Alex.');
const reply2 = await session.prompt('What is my name?'); // Model remembers "Alex"
```

### Constrain responses with a prefix

Guide the model's response format by prefilling the start of its reply:

```js
const result = await session.prompt([
  { role: 'user', content: 'Create a TOML config for a web server' },
  { role: 'assistant', content: '```toml\n', prefix: true },
]);
```

---

## Multimodal Inputs

The Prompt API supports image and audio inputs alongside text.

### Supported image types
`HTMLImageElement`, `SVGImageElement`, `HTMLVideoElement`, `HTMLCanvasElement`, `ImageBitmap`, `OffscreenCanvas`, `VideoFrame`, `Blob`, `ImageData`

### Supported audio types
`AudioBuffer`, `ArrayBufferView`, `ArrayBuffer`, `Blob`

### Example: image analysis

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const imageBlob = await fetch('photo.jpg').then(r => r.blob());

const result = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Describe what you see in this image:' },
      { type: 'image', value: imageBlob },
    ],
  },
]);
console.log(result);
```

> **Note:** For more multimodal examples like audio transcription and comparing images, see [reference/multimodal.md](reference/multimodal.md).

---

## Structured Output (JSON Schema)

Use `responseConstraint` to force the model to return output matching a JSON Schema. This is useful for classification, extraction, and any task where you need machine-readable output.

### Boolean classification

```js
const session = await LanguageModel.create();

const result = await session.prompt(
  'Is this review positive? "Great product, highly recommend!"',
  { responseConstraint: { type: 'boolean' } }
);
console.log(JSON.parse(result)); // true
```

> **Note:** For more structured output examples like object extraction and omitting schemas, see [reference/structured-output.md](reference/structured-output.md).

---

## Appending Context (Pre-loading Inputs)

Use `session.append()` to pre-load context before prompting — useful when processing multimodal inputs that take time to prepare:

```js
const session = await LanguageModel.create({
  initialPrompts: [{ role: 'system', content: 'You analyze uploaded images.' }],
  expectedInputs: [{ type: 'image' }],
});

// Pre-load images as the user uploads them
fileInput.onchange = async () => {
  await session.append([{
    role: 'user',
    content: [
      { type: 'text', value: `Image notes: ${notesInput.value}` },
      { type: 'image', value: fileInput.files[0] },
    ],
  }]);
};

// Later, prompt with the pre-loaded context
analyzeBtn.onclick = async () => {
  const result = await session.prompt('What patterns do you see across these images?');
  output.textContent = result;
};
```

---

## Session Management

### Check token usage

Each session has a context window. Monitor usage to avoid hitting the limit:

```js
console.log(`Tokens used: ${session.inputUsage} / ${session.inputQuota}`);
```

When the context window fills up, the oldest messages are dropped, which can degrade response quality.

### Clone a session

Fork a session to explore different conversation branches without losing the original context:

```js
const clonedSession = await session.clone();
// clonedSession has the same history and settings as session
// Changes to one don't affect the other
```

### Destroy a session

Free resources when you're done:

```js
session.destroy();
// Any further calls to session.prompt() will throw
```

### Restore a session from storage

Persist conversation history and restore it across page loads:

```js
// Save conversation turns to localStorage
sessionData.initialPrompts.push(
  { role: 'user', content: userMessage },
  { role: 'assistant', content: modelReply },
);
localStorage.setItem(sessionId, JSON.stringify(sessionData));

// Restore on next load
const stored = JSON.parse(localStorage.getItem(sessionId));
const session = await LanguageModel.create(stored);
```

See [reference/session-patterns.md](reference/session-patterns.md) for a complete restore-from-storage example.

---

## Permissions and Iframes

The Prompt API is available to:
- Top-level windows (always)
- Same-origin iframes (always)
- Cross-origin iframes (only with explicit permission)

To grant a cross-origin iframe access:

```html
<iframe src="https://other-origin.example.com/" allow="language-model"></iframe>
```

> The Prompt API is **not available in Web Workers**.

---

## Error Handling

When working with the Prompt API, common errors include:

- `AbortError`: Triggered when an `AbortController` stops an ongoing prompt. Catch this to suppress UI errors if the user clicked "Cancel".
- `NotSupportedError`: Triggered if a `responseConstraint` or expected modal format (e.g. `type: 'image'`) is unsupported on the current device.
- `InvalidStateError`: Triggered if you try to `prompt()` after `destroy()` has been called. Ensure sessions are only called when active.
- `QuotaExceededError`: Triggered if the prompt size exceeds the input quota. Consider breaking the request into smaller chunks or truncating history.

---

## Origin trial setup

The Prompt API is available as an origin trial:

1. Accept [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).
2. Register for the origin trial (check the Chrome documentation for the current origin trial registration link).
3. Add the token to your page or extension manifest.

**For localhost development**, enable these Chrome flags and relaunch:
1. `chrome://flags/#optimization-guide-on-device-model` → **Enabled**
2. `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` → **Enabled**

> **Debugging Tip:** You can monitor model download progress and see the model size by visiting `chrome://on-device-internals`.

---

## Common Patterns

### Feature detection + graceful degradation

```js
async function initAI() {
  // Note: The Prompt API is not available in Web Workers
  if (!('LanguageModel' in self)) {
    showFallback('Browser does not support the Prompt API.');
    return null;
  }

  const availability = await LanguageModel.availability();
  if (availability === 'unavailable') {
    showFallback('Device does not meet hardware requirements.');
    return null;
  }

  return await LanguageModel.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        updateProgress(e.loaded); // Show download progress to user
      });
    },
  });
}
```

### Streaming output to the DOM

```js
async function streamToElement(session, prompt, element) {
  element.textContent = '';
  const stream = session.promptStreaming(prompt);
  for await (const chunk of stream) {
    element.textContent = chunk;
  }
}
```

### Reusable session with quota guard

```js
class AISession {
  constructor(session) { this.session = session; }

  async prompt(text) {
    if (this.session.inputUsage / this.session.inputQuota > 0.9) {
      // Context nearly full — clone to preserve recent context, destroy old
      const fresh = await this.session.clone();
      this.session.destroy();
      this.session = fresh;
    }
    return this.session.prompt(text);
  }

  destroy() { this.session.destroy(); }
}
```

---

## Reference

For deeper coverage of specific topics, read:

- [reference/session-patterns.md](reference/session-patterns.md) — Session restore, n-shot prompting, conversation management
- [reference/multimodal.md](reference/multimodal.md) — Image and audio input patterns with full examples
- [reference/structured-output.md](reference/structured-output.md) — JSON Schema constraints, regex patterns, classification tasks
