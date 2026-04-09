# Multimodal Inputs

## Table of Contents
- [Supported input types](#supported-input-types)
- [Declaring modalities at session creation](#declaring-modalities-at-session-creation)
- [Image inputs](#image-inputs)
- [Audio inputs](#audio-inputs)
- [Mixed modality prompts](#mixed-modality-prompts)
- [Pre-loading with append()](#pre-loading-with-append)
- [Error handling](#error-handling)

---

## Supported input types

### Images
| Type | Notes |
|---|---|
| `HTMLImageElement` | `<img>` element — must be fully loaded |
| `SVGImageElement` | SVG `<image>` element |
| `HTMLVideoElement` | Uses the frame at the current playback position |
| `HTMLCanvasElement` | Captures the current canvas contents |
| `ImageBitmap` | Created via `createImageBitmap()` |
| `OffscreenCanvas` | Off-screen rendering canvas |
| `VideoFrame` | From the WebCodecs API |
| `Blob` | Image file as a Blob (e.g., from `fetch()` or `<input type="file">`) |
| `ImageData` | Raw pixel data |

### Audio
| Type | Notes |
|---|---|
| `AudioBuffer` | Decoded audio from the Web Audio API |
| `ArrayBufferView` | Typed array view of raw audio bytes |
| `ArrayBuffer` | Raw audio bytes |
| `Blob` | Audio file as a Blob |

---

## Declaring modalities at session creation

You must declare which input and output types your session will use when calling `LanguageModel.create()`. The model uses this to prepare the right processing pipeline.

```js
// Text + image session
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

// Text + audio session
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'audio' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

// All modalities
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
    { type: 'audio' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});
```

> If you send an input type you didn't declare, the model may throw a `NotSupportedError` DOMException.

---

## Image inputs

### Describe an image from a URL

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const imageBlob = await fetch('https://example.com/photo.jpg').then(r => r.blob());

const description = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Describe this image in detail:' },
      { type: 'image', value: imageBlob },
    ],
  },
]);
console.log(description);
```

### Analyze a user-uploaded image

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file.type.startsWith('image/')) return;

  const result = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'What is in this image? Generate alt text for it.' },
        { type: 'image', value: file }, // File extends Blob
      ],
    },
  ]);
  altTextOutput.textContent = result;
};
```

### Analyze a canvas drawing

```js
const canvas = document.getElementById('drawing-canvas');
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

analyzeBtn.onclick = async () => {
  const feedback = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'Give constructive feedback on this sketch:' },
        { type: 'image', value: canvas },
      ],
    },
  ]);
  feedbackOutput.textContent = feedback;
};
```

### Compare two images

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const [referenceBlob, submittedBlob] = await Promise.all([
  fetch('reference.jpg').then(r => r.blob()),
  fetch('submitted.jpg').then(r => r.blob()),
]);

const critique = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Compare these two images. How closely does the second match the first? List differences.' },
      { type: 'image', value: referenceBlob },
      { type: 'image', value: submittedBlob },
    ],
  },
]);
```

### Capture a video frame

```js
const video = document.querySelector('video');
// Ensure video is paused at the frame you want to analyze
video.pause();

const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

const result = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'What is happening in this video frame?' },
      { type: 'image', value: video }, // Uses current frame position
    ],
  },
]);
```

---

## Audio inputs

### Transcribe microphone input

```js
async function captureMicrophoneAudio(seconds) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  return new Promise((resolve) => {
    const chunks = [];
    processor.onaudioprocess = (e) => {
      chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };
    source.connect(processor);
    processor.connect(audioContext.destination);

    setTimeout(() => {
      stream.getTracks().forEach(t => t.stop());
      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const combined = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const buffer = audioContext.createBuffer(1, combined.length, audioContext.sampleRate);
      buffer.copyToChannel(combined, 0);
      resolve(buffer);
    }, seconds * 1000);
  });
}

// Usage
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'audio' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

recordBtn.onclick = async () => {
  const audioBuffer = await captureMicrophoneAudio(10);
  const transcript = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'Transcribe this audio recording:' },
        { type: 'audio', value: audioBuffer },
      ],
    },
  ]);
  transcriptOutput.textContent = transcript;
};
```

### Analyze an audio file

```js
const session = await LanguageModel.create({
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'audio' }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

audioFileInput.onchange = async () => {
  const file = audioFileInput.files[0];
  const result = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'Summarize the key points from this audio:' },
        { type: 'audio', value: file }, // File extends Blob
      ],
    },
  ]);
  summaryOutput.textContent = result;
};
```

---

## Mixed modality prompts

You can combine text, images, and audio in a single prompt or across turns in the same session.

```js
const session = await LanguageModel.create({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
    { type: 'audio' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

// Turn 1: analyze an image
const imageBlob = await fetch('product.jpg').then(r => r.blob());
const imageAnalysis = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Describe this product:' },
      { type: 'image', value: imageBlob },
    ],
  },
]);

// Turn 2: follow up with a voice question about the same product
const audioBuffer = await captureMicrophoneAudio(5);
const voiceFollowUp = await session.prompt([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'The user asked a follow-up question about the product:' },
      { type: 'audio', value: audioBuffer },
    ],
  },
]);
```

---

## Pre-loading with append()

For multimodal inputs that take time to process (large images, long audio), use `session.append()` to pre-load them before the user asks their question. The model starts processing the input immediately, so by the time the user prompts, it's already prepared.

```js
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are an expert art critic.' },
  ],
  expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
});

// Pre-load images as the user uploads them (before they ask a question)
uploadArea.ondrop = async (e) => {
  for (const file of e.dataTransfer.files) {
    if (!file.type.startsWith('image/')) continue;

    // append() returns a promise that resolves when the input is processed
    await session.append([{
      role: 'user',
      content: [
        { type: 'text', value: `Uploaded image: ${file.name}` },
        { type: 'image', value: file },
      ],
    }]);
    showThumbnail(file); // Show confirmation in UI
  }
};

// When the user asks a question, the images are already in context
askBtn.onclick = async () => {
  const answer = await session.prompt(questionInput.value);
  answerOutput.textContent = answer;
};
```

---

## Error handling

### NotSupportedError

Thrown when you send an input type that wasn't declared in `expectedInputs`, or when the model doesn't support the requested modality combination:

```js
try {
  const result = await session.prompt([
    {
      role: 'user',
      content: [
        { type: 'text', value: 'Describe this:' },
        { type: 'image', value: imageBlob },
      ],
    },
  ]);
} catch (e) {
  if (e.name === 'NotSupportedError') {
    // Either image wasn't declared in expectedInputs,
    // or this device/model doesn't support image inputs
    showFallback('Image analysis is not supported on this device.');
  } else {
    throw e;
  }
}
```

### Check availability for specific modalities

Before creating a multimodal session, check if the device supports it:

```js
const availability = await LanguageModel.availability({
  expectedInputs: [
    { type: 'text', languages: ['en'] },
    { type: 'image' },
  ],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
});

if (availability === 'unavailable') {
  // Fall back to text-only mode
  enableTextOnlyMode();
} else {
  enableMultimodalMode();
}
```
