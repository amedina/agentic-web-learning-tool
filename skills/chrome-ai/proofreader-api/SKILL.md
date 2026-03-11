---
name: Proofreader API
description: >
  Guide for writing code that uses Chrome's built-in Proofreader API (interactive proofreading with Gemini Nano in the browser).
  Make sure to use this skill whenever the user mentions correcting grammar, checking spelling, fixing punctuation, interactive proofreading, or wants to use the Proofreader API. Trigger this for any mention of: Proofreader API, Proofreader.create, proofreader.proofread, ProofreadResult, grammar checking, spelling checking in the browser, or on-device proofreading with Gemini Nano.
tags:
  - chrome
  - ai
  - proofreader-api
---

# Proofreader API

The Proofreader API provides interactive proofreading to web applications or extensions using built-in AI (Gemini Nano) in Chrome. It can correct grammar, spelling, and punctuation errors.

## Quick-start pattern

```js
// 1. Feature detect
if (!('Proofreader' in self)) {
  console.warn('Proofreader API not supported');
  return;
}

// 2. Check availability — pass the required options you'll use in create()
const availability = await Proofreader.availability({ 
  expectedInputLanguages: ['en'], 
  correctionExplanationLanguage: 'en' 
});
// 'available' | 'downloadable' | 'downloading' | 'unavailable'

// 3. Create proofreader (with optional download monitor and expected languages)
const proofreader = await Proofreader.create({
  expectedInputLanguages: ['en'],
  includeCorrectionTypes: true,
  includeCorrectionExplanations: true,
  correctionExplanationLanguage: 'en',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Model download: ${Math.round(e.loaded * 100)}%`);
    });
  },
});

// 4. Proofread content
const result = await proofreader.proofread(
  'I seen him yesterday at the store, and he bought two loafs of bread.'
);

// 5. Use the result
console.log(result.correctedInput); // 'I saw him yesterday at the store, and he bought two loaves of bread.'
// result.corrections is an array of objects detailing startIndex, endIndex, etc.

// 6. Clean up
proofreader.destroy();
```

## Availability check pattern

Always check availability before creating a proofreader. Handle all four states:

```js
async function createProofreader(options = {}) {
  if (!('Proofreader' in self)) return null;

  // Pass required language constraints to availability()
  const availability = await Proofreader.availability({
    expectedInputLanguages: options.expectedInputLanguages || ['en'],
    correctionExplanationLanguage: options.correctionExplanationLanguage || 'en',
  });

  if (availability === 'unavailable') {
    // Hardware requirements not met — don't proceed
    return null;
  }

  if (availability === 'available') {
    // Model already downloaded — create immediately
    return await Proofreader.create(options);
  }

  // 'downloadable' or 'downloading' — trigger download with progress
  return await Proofreader.create({
    ...options,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        const pct = Math.round(e.loaded * 100);
        console.log(`Downloading model: ${pct}%`);
        // Update your UI progress indicator here
      });
    },
  });
}
```

## Configuration options

| Option | Values | Notes |
|--------|--------|-------|
| `expectedInputLanguages` | string[] (BCP 47) | **Required in practice.** An array of expected input languages. |
| `includeCorrectionTypes` | `boolean` | When `true`, each correction includes a `types` array with labels like `"spelling"`, `"grammar"`, `"punctuation"`, etc. |
| `includeCorrectionExplanations` | `boolean` | When `true`, each correction includes an `explanation` string describing the error. |
| `correctionExplanationLanguage` | string (BCP 47) | **Required.** Language for the correction explanations (e.g., `'en'`). Always set this to avoid "No output language was specified" console warnings. Pass to both `availability()` and `create()`. |
| `signal` | `AbortSignal` | For cancellation of proofreader creation or inference. |

## Handling the ProofreadResult

Calling `proofread()` returns a `ProofreadResult` object which has two important properties:
- `correctedInput`: The fully corrected string.
- `corrections`: An array of individual correction objects. Each object provides:
  - `startIndex` and `endIndex`: The error's position in the original string.
  - `correction`: The suggested replacement text.
  - `types` (when `includeCorrectionTypes: true`): An array of error type labels — `"spelling"`, `"grammar"`, `"punctuation"`, `"capitalization"`, `"preposition"`, or `"missing-words"`.
  - `explanation` (when `includeCorrectionExplanations: true`): A plain-language description of the error.

Here is a common pattern for rendering the input text and highlighting the errors:

```js
const proofreadResult = await proofreader.proofread(input);

let inputRenderIndex = 0;
const editBox = document.getElementById('edit-box');
editBox.innerHTML = ''; // Clear existing content

for (const correction of proofreadResult.corrections) {
  // Render part of input that has no error.
  if (correction.startIndex > inputRenderIndex) {
    const unchangedInput = document.createElement('span');
    unchangedInput.textContent = input.substring(inputRenderIndex, correction.startIndex);
    editBox.append(unchangedInput);
  }

  // Render part of input that has an error and highlight it
  const errorInput = document.createElement('span');
  errorInput.textContent = input.substring(correction.startIndex, correction.endIndex);
  errorInput.classList.add('error'); // Apply CSS styling for errors
  // You might attach a tooltip or click handler to errorInput to show the suggested correction here
  editBox.append(errorInput);

  inputRenderIndex = correction.endIndex;
}

// Render the rest of the input that has no error.
if (inputRenderIndex !== input.length) {
  const unchangedInput = document.createElement('span');
  unchangedInput.textContent = input.substring(inputRenderIndex, input.length);
  editBox.append(unchangedInput);
}
```

## iframes and Permission Policy

The Proofreader API is available to top-level windows and same-origin iframes by default. To grant access to cross-origin iframes:

```html
<iframe src="https://cross-origin.example.com/" allow="proofreader"></iframe>
```

> **Note:** The Proofreader API is **not** available in Web Workers due to permissions policy checking complexity.

## Hardware requirements

The Proofreader API requires Gemini Nano, which has these minimum requirements:
- **OS**: Windows 10/11, macOS 13+, Linux, or ChromeOS (Chromebook Plus). Not supported on mobile.
- **Storage**: 22 GB free space on the Chrome profile volume.
- **GPU**: >4 GB VRAM, **or** CPU with ≥16 GB RAM and ≥4 cores.
- **Network**: Unmetered connection for initial model download.

## Origin trial setup

The Proofreader API is in an origin trial (Chrome 141-145):

1. Accept [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy)
2. Register at the [Proofreader API origin trial](https://developer.chrome.com/origintrials/#/registration/2794008579760193537)
3. Add the token to your page or extension manifest

**For localhost development**, enable these Chrome flags:
- `chrome://flags/#optimization-guide-on-device-model` → **Enabled**
- `chrome://flags/#proofreader-api-for-gemini-nano` → **Enabled**

## Reference

For deeper coverage, read:
- [references/patterns.md](references/patterns.md) — Advanced patterns: handling multiple languages, cancellation, UI highlighting and progressive enhancement.
