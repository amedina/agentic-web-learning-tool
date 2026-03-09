---
name: Translator API
description: >
  Guide for writing code that uses Chrome's built-in Translator API (self.Translator / built-in AI in the browser) and the Language Detector API (self.LanguageDetector).
  Make sure to use this skill whenever the user mentions translating text, adding multi-language support to a web app, running on-device translations, or converting language client-side without a backend.
  Trigger this skill for any mention of: Translator, translation, multi-language, language detector, built-in AI, self.Translator, or translating web content client-side.
tags:
  - chrome
  - ai
  - translator-api
  - language-detector
  - on-device
  - browser-ai
---

# Translator API — Development Guide

> **When to use the Translator API?** Use this for translating text content between languages efficiently on the client-side without relying on a cloud backend. If the source language is unknown, you should also use the Language Detector API first.

## Overview

The Translator API gives web pages direct access to a built-in expert model trained to generate high-quality translations natively in Chrome. It operates sequentially and handles model downloading automatically if language packs are missing.

Key capabilities:
- On-device text translation between BCP 47 language codes (e.g., 'en', 'fr', 'es').
- Support for chunked/streaming translation for long text.
- Fallback language detection via `LanguageDetector` API when the source language is unknown.

> **Hardware / Browser requirements**: Requires Chrome with built-in AI enabled. The API can only be accessed in top-level windows and same-origin iframes (or cross-origin iframes granted `allow="translator"`). **Not available in Web Workers.**

---

## Quick Start

### 1. Simple Translation (Known Languages)

```javascript
// 1. Check feature support
if (!('Translator' in self)) {
  console.error("Translator API not supported in this browser.");
  return;
}

// 2. Check model availability
const availability = await Translator.availability({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
});

if (availability === 'no') {
  console.error("Translation between these languages is not available.");
  return;
}

// 3. Create the translator (with download progress handling)
const translator = await Translator.create({
  sourceLanguage: 'en',
  targetLanguage: 'fr',
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloading language pack: ${Math.round((e.loaded / e.total) * 100)}%`);
    });
  },
});

// 4. Translate text
const translatedText = await translator.translate("Where is the nearest bus stop?");
console.log(translatedText); // "Où est l'arrêt de bus le plus proche ?"
```

### 2. Streaming Translation for Long Texts

```javascript
const stream = translator.translateStreaming(longText);
for await (const chunk of stream) {
  console.log("Chunk received:", chunk);
  // Update UI incrementally
}
```

---

## Fallback Mechanisms & Handling Unknown Sources

When you don't know the source language of the text, you must use the **Language Detector API** to identify it before calling the Translator API.

```javascript
async function translateUnknownText(text, targetLanguage) {
  // Check if LanguageDetector is supported
  if (!('LanguageDetector' in self)) {
    throw new Error("Language Detector API not supported. Cannot translate unknown text.");
  }

  // Create detector with download monitoring
  const detector = await LanguageDetector.create({
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Language model download: ${Math.round((e.loaded / e.total) * 100)}%`);
      });
    }
  });

  // Detect language
  const results = await detector.detect(text);
  if (!results || results.length === 0) {
    throw new Error("Could not detect the source language.");
  }

  // Pick the language with the highest confidence
  const sourceLanguage = results[0].detectedLanguage;

  // Verify translator availability
  const availability = await Translator.availability({ sourceLanguage, targetLanguage });
  if (availability === 'no') {
    throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} not supported.`);
  }

  // Create translator and translate
  const translator = await Translator.create({
    sourceLanguage,
    targetLanguage,
  });

  return await translator.translate(text);
}
```

### Important Caveats & Best Practices
- **Model Downloads**: Language packs and the language detector model are downloaded on demand. ALWAYS implement a `monitor` callback on `.create()` to listen for `downloadprogress` events and surface this to the user (e.g., via a loading bar or spinner), as large downloads may take time.
- **Sequential Execution**: Translations block sequentially. If processing many texts, chunk them to prevent blocking the UI, and use visual loading indicators.
- **Error Handling**: Use `try/catch` around `Translator.create()` and `translate()`. The ready promise rejects if a download fails.

---

## Testing the API Code
For details on testing the Translator API and the code generated using this skill, see [reference/testing.md](./reference/testing.md).
