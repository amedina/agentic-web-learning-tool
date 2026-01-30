# The Prompt API

With the Prompt API, you can send natural language requests to [Gemini Nano](https://deepmind.google/technologies/gemini/nano/) in the browser.

There are many ways you can use the Prompt API. For example, you could build:

-   **AI-powered search**: Answer questions based on the content of a web page.
-   **Personalized news feeds**: Build a feed that dynamically classifies articles with categories and allow for users to filter for that content.
-   **Custom content filters**. Analyze news articles and automatically blur or hide content based on user-defined topics.
-   **Calendar event creation**. Develop a Chrome Extension that automatically extracts event details from web pages, so users can create calendar entries in just a few steps.
-   **Seamless contact extraction**. Build an extension that extracts contact information from websites, making it easier for users to contact a business or add details to their list of contacts.

### Review the hardware requirements

The following requirements exist for developers and the users who operate features using these APIs in Chrome. Other browsers may have different operating requirements.

The Language Detector and Translator APIs work in Chrome on desktop. These APIs do not work on mobile devices. The Prompt API, Summarizer API, Writer API, Rewriter API, and Proofreader API work in Chrome when the following conditions are met:

-   **Operating system**: Windows 10 or 11; macOS 13+ (Ventura and onwards); Linux; or ChromeOS (from Platform 16389.0.0 and onwards) on [Chromebook Plus](https://www.google.com/chromebook/chromebookplus/) devices. Chrome for Android, iOS, and ChromeOS on non-Chromebook Plus devices are not yet supported by the APIs which use Gemini Nano.
-   **Storage**: At least 22 GB of free space on the volume that contains your Chrome profile.
-   **GPU or CPU**: Built-in models can run with GPU or CPU.
    -   **GPU**: Strictly more than 4 GB of VRAM.
    -   **CPU**: 16 GB of RAM or more and 4 CPU cores or more.
-   **Network**: Unlimited data or an unmetered connection.

Gemini Nano's exact size may vary as the browser updates the model. To determine the current size, visit `chrome://on-device-internals`.

## Use the Prompt API

The Prompt API uses the Gemini Nano model in Chrome. While the API is built into Chrome, the model is downloaded separately the first time an origin uses the API. Before you use this API, acknowledge [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).

To determine if the model is ready to use, call [`LanguageModel.availability()`](/docs/ai/get-started#model_download).

```
const availability = await LanguageModel.availability({
  // The same options in `prompt()` or `promptStreaming()`
});
```

To trigger the download and instantiate the language model, check for [user activation](/docs/ai/get-started#user-activation). Then, call the [`create()` function](#create_a_session).

```
const session = await LanguageModel.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
});
```

If the response to `availability()` was `downloading`, listen for download progress and [inform the user](/docs/ai/inform-users-of-model-download), as the download may take time.

### Use on localhost

All of the built-in AI APIs are available on `localhost` in Chrome. Set the following flags to **Enabled**:

-   `chrome://flags/#optimization-guide-on-device-model`
-   `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`

Then click **Relaunch** or restart Chrome. If you encounter errors, [troubleshoot localhost](/docs/ai/get-started#troubleshoot_localhost).

### Model parameters

The `params()` function informs you of the language model's parameters. The object has the following fields:

-   `defaultTopK`: The default [top-K](https://ai.google.dev/gemini-api/docs/models/generative-models) value.
-   `maxTopK`: The [maximum top-K](https://ai.google.dev/gemini-api/docs/models/generative-models) value.
-   `defaultTemperature`: The default [temperature](https://ai.google.dev/gemini-api/docs/models/generative-models).
-   `maxTemperature`: The maximum temperature.

```
await LanguageModel.params();
// {defaultTopK: 3, maxTopK: 128, defaultTemperature: 1, maxTemperature: 2}
```

### Create a session

Once the Prompt API can run, you create a session with the `create()` function.

Each session can be customized with `topK` and `temperature` using an optional options object. The default values for these parameters are returned from `LanguageModel.params()`.

```
const params = await LanguageModel.params();
// Initializing a new session must either specify both `topK` and
// `temperature` or neither of them.
const slightlyHighTemperatureSession = await LanguageModel.create({
  temperature: Math.max(params.defaultTemperature * 1.2, 2.0),
  topK: params.defaultTopK,
});
```

The `create()` function's optional options object also takes a `signal` field, which lets you pass an `AbortSignal` to destroy the session.

```
const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const session = await LanguageModel.create({
  signal: controller.signal,
});
```

### Add context with initial prompts

With initial prompts, you can provide the language model with context about previous interactions, for example, to allow the user to resume a stored session after a browser restart.

```
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are a helpful and friendly assistant.' },
    { role: 'user', content: 'What is the capital of Italy?' },
    { role: 'assistant', content: 'The capital of Italy is Rome.' },
    { role: 'user', content: 'What language is spoken there?' },
    {
      role: 'assistant',
      content: 'The official language of Italy is Italian. [...]',
    },
  ],
});
```

#### Constrain responses with a prefix

You can add an `"assistant"` role, in addition to previous roles, to elaborate on the model's previous responses. For example:

```
const followup = await session.prompt([
  {
    role: "user",
    content: "I'm nervous about my presentation tomorrow"
  },
  {
    role: "assistant",
    content: "Presentations are tough!"
  }
]);
```

In some cases, instead of requesting a new response, you may want to prefill part of the `"assistant"`\-role response message. This can be helpful to guide the language model to use a specific response format. To do this, add `prefix: true` to the trailing `"assistant"`\-role message. For example:

```
const characterSheet = await session.prompt([
  {
    role: 'user',
    content: 'Create a TOML character sheet for a gnome barbarian',
  },
  {
    role: 'assistant',
    content: '```toml\n',
    prefix: true,
  },
]);
```

### Add expected input and output

The Prompt API has [multimodal capabilities](#multimodal_capabilities) and supports multiple languages. Set the `expectedInputs` and `expectedOutputs` modalities and languages when creating your session.

-   `type`: Modality expected.
    -   For `expectedInputs`, this can be `text`, `image`, or `audio`.
    -   For `expectedOutputs`, the Prompt API allows `text` only.
-   `languages`: Array to set the language or languages expected. The Prompt API accepts `"en"`, `"ja"`, and `"es"`. Support for additional languages is in development.
    -   For `expectedInputs`, set the system prompt language and one or more expected user prompt languages.
    -   Set one or more `expectedOutputs` languages.

```
const session = await LanguageModel.create({
  expectedInputs: [
    { type: "text", languages: ["en" /* system prompt */, "ja" /* user prompt */] }
  ],
  expectedOutputs: [
    { type: "text", languages: ["ja"] }
  ]
});
```

You may receive a `"NotSupportedError"` DOMException if the model encounters an unsupported input or output.

### Multimodal capabilities

With these capabilities, you could:

-   Allow users to transcribe audio messages sent in a chat application.
-   Describe an image uploaded to your website for use in a caption or alt text.

The Prompt API supports the following input types:

-   Audio:
    -   [`AudioBuffer`](https://developer.mozilla.org/docs/Web/API/AudioBuffer)
    -   [`ArrayBufferView`](https://webidl.spec.whatwg.org/#ArrayBufferView)
    -   [`ArrayBuffer`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
    -   [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob)
-   Visual:
    -   [`HTMLImageElement`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement)
    -   [`SVGImageElement`](https://developer.mozilla.org/docs/Web/API/SVGImageElement)
    -   [`HTMLVideoElement`](https://developer.mozilla.org/docs/Web/API/HTMLVideoElement) (uses the video frame at the current video position)
    -   [`HTMLCanvasElement`](https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement)
    -   [`ImageBitmap`](https://developer.mozilla.org/docs/Web/API/ImageBitmap)
    -   [`OffscreenCanvas`](https://developer.mozilla.org/docs/Web/API/OffscreenCanvas)
    -   [`VideoFrame`](https://developer.mozilla.org/docs/Web/API/VideoFrame)
    -   [`Blob`](https://developer.mozilla.org/docs/Web/API/Blob)
    -   [`ImageData`](https://developer.mozilla.org/docs/Web/API/ImageData)

This snippet shows a multimodal session that first processes two visuals (one image `Blob` and one `HTMLCanvasElement`) and has the AI compare them, and that second lets the user respond with an audio recording (as an `AudioBuffer`).

```
const session = await LanguageModel.create({
  expectedInputs: [
    { type: "text", languages: ["en"] },
    { type: "audio" },
    { type: "image" },
  ],
  expectedOutputs: [{ type: "text", languages: ["en"] }],
});

const referenceImage = await (await fetch("reference-image.jpeg")).blob();
const userDrawnImage = document.querySelector("canvas");

const response1 = await session.prompt([
  {
    role: "user",
    content: [
      {
        type: "text",
        value:
          "Give a helpful artistic critique of how well the second image matches the first:",
      },
      { type: "image", value: referenceImage },
      { type: "image", value: userDrawnImage },
    ],
  },
]);
console.log(response1);

const audioBuffer = await captureMicrophoneInput({ seconds: 10 });

const response2 = await session.prompt([
  {
    role: "user",
    content: [
      { type: "text", value: "My response to your critique:" },
      { type: "audio", value: audioBuffer },
    ],
  },
]);
console.log(response2);
```

### Append messages

Inference may take some time, especially when prompting with multimodal inputs. It can be useful to send predetermined prompts in advance to populate the session, so the model can get a head start on processing.

While `initialPrompts` are useful at session creation, the `append()` method can be used in addition to the `prompt()` or `promptStreaming()` methods, to give additional additional contextual prompts after the session is created.

For example:

```
const session = await LanguageModel.create({
  initialPrompts: [
    {
      role: 'system',
      content:
        'You are a skilled analyst who correlates patterns across multiple images.',
    },
  ],
  expectedInputs: [{ type: 'image' }],
});

fileUpload.onchange = async () => {
  await session.append([
    {
      role: 'user',
      content: [
        {
          type: 'text',
          value: `Here's one image. Notes: ${fileNotesInput.value}`,
        },
        { type: 'image', value: fileUpload.files[0] },
      ],
    },
  ]);
};

analyzeButton.onclick = async (e) => {
  analysisResult.textContent = await session.prompt(userQuestionInput.value);
};
```

The promise returned by `append()` fulfills once the prompt has been validated, processed, and appended to the session. The promise is rejected if the prompt cannot be appended.

### Pass a JSON Schema

Add the `responseConstraint` field to `prompt()` or `promptStreaming()` method to pass a JSON Schema as the value. You can then use structured output with the Prompt API.

For example, you prompt the model to assign at most three hashtags for a post on an online social network. The ideal output could look similar to the following JSON:

```
{
  "hashtags": [
    "#pottery",
    "#dyi"
  ]
}
```

The corresponding JSON Schema for this requested output object shape would then look as follows:

```
{
  "type": "object",
  "properties": {
    "hashtags": {
      "type": "array",
      "maxItems": 3,
      "items": {
        "type": "string",
        "pattern": "^#[^\\s#]+$"
      }
    }
  },
  "required": ["hashtags"],
  "additionalProperties": false
}
```

This JSON Schema defines a structure for an object that must contain a `hashtags` field with the following constraints:

-   `"type": "object"`: The root value must be a JSON object.
-   `"properties": { "hashtags": ... }`: The object can (and in this case, must) have a property called `hashtags`.
-   `"hashtags":`
    -   `"type": "array"`: The value must be an array.
    -   `"maxItems": 3`: The array can contain at most 3 items.
    -   `"items": { "type": "string", "pattern": "^#[^\\s#]+$" }`: Each item in the array must be a string that matches the given regular expression pattern.
-   `"required": ["hashtags"]`: The object must contain the `hashtags` property.
-   `"additionalProperties": false`: No other properties than hashtags are allowed.

In the following example, the JSON Schema makes sure the model responds with `true` or `false` to classify if a given message is about pottery.

```
const session = await LanguageModel.create();

const schema = {
  "type": "boolean"
};

const post = "Mugs and ramen bowls, both a bit smaller than intended, but that
happens with reclaim. Glaze crawled the first time around, but pretty happy
with it after refiring.";

const result = await session.prompt(
  `Is this post about pottery?\n\n${post}`,
  {
    responseConstraint: schema,
  }
);
console.log(JSON.parse(result));
// true
```

Your implementation can include a JSON Schema or regular expression as part of the message sent to the model. This uses some of the [input quota](#session_management). You can measure how much of the input quota it will use by passing the `responseConstraint` option to `session.measureInputUsage()`.

You can avoid this behavior with the `omitResponseConstraintInput` option. If you do so, we recommend that you include some guidance in the prompt:

```
const result = await session.prompt(`
  Summarize this feedback into a rating between 0-5. Only output a JSON
  object { rating }, with a single property whose value is a number:
  The food was delicious, service was excellent, will recommend.
`, { responseConstraint: schema, omitResponseConstraintInput: true });
```

## Prompt the model

You can prompt the model with either the `prompt()` or the `promptStreaming()` functions.

### Request-based output

If you expect a short result, you can use the `prompt()` function that returns the response once it's available.

```
// Start by checking if it's possible to create a session based on the
// availability of the model, and the characteristics of the device.
const { defaultTemperature, maxTemperature, defaultTopK, maxTopK } =
  await LanguageModel.params();

const available = await LanguageModel.availability({
  expectedInputs: [{type: 'text', languages: ['en']}],
  expectedOutputs: [{type: 'text', languages: ['en']}],
});

if (available !== 'unavailable') {
  const session = await LanguageModel.create();

  // Prompt the model and wait for the whole result to come back.
  const result = await session.prompt('Write me a poem!');
  console.log(result);
}
```

### Streamed output

If you expect a longer response, you should use the `promptStreaming()` function which lets you show partial results as they come in from the model. The `promptStreaming()` function returns a `ReadableStream`.

```
const { defaultTemperature, maxTemperature, defaultTopK, maxTopK } =
  await LanguageModel.params();

const available = await LanguageModel.availability({
  expectedInputs: [{type: 'text', languages: ['en']}],
  expectedOutputs: [{type: 'text', languages: ['en']}],
});
if (available !== 'unavailable') {
  const session = await LanguageModel.create();

  // Prompt the model and stream the result:
  const stream = session.promptStreaming('Write me an extra-long poem!');
  for await (const chunk of stream) {
    console.log(chunk);
  }
}
```

### Stop prompting

Both `prompt()` and `promptStreaming()` accept an optional second parameter with a `signal` field, which lets you stop running prompts.

```
const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const result = await session.prompt('Write me a poem!', {
  signal: controller.signal,
});
```

## Session management

Each session keeps track of the context of the conversation. Previous interactions are taken into account for future interactions until the session's context window is full.

Each session has a maximum number of tokens it can process. Check your progress towards this limit with the following:

```
console.log(`${session.inputUsage}/${session.inputQuota}`);
```

When this context window is exceeded, it causes the session to lose track of the oldest messages. This may lead to worse results if the context was important. To preserve quota, if a user determines the model's answer isn't useful, allow them to stop the session with `AbortController`.

### Clone a session

To preserve resources, you can copy an existing session with the `clone()` function. This creates a fork of the conversation, where the context and initial prompt are preserved.

The `clone()` function takes an optional options object with a `signal` field, which lets you pass an `AbortSignal` to destroy the cloned session.

```
const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const clonedSession = await session.clone({
  signal: controller.signal,
});
```

### Terminate a session

Call `destroy()` to free resources if you no longer need a session. When a session is destroyed, it can no longer be used, and any ongoing execution is aborted. You may want to keep the session around if you intend to prompt the model often since creating a session can take some time.

```
await session.prompt(
  "You are a friendly, helpful assistant specialized in clothing choices."
);

session.destroy();

// The promise is rejected with an error explaining that
// the session is destroyed.
await session.prompt(
  "What should I wear today? It is sunny, and I am choosing between a t-shirt
  and a polo."
);
```

### Restore a past session

With _initial prompts_, you can prime the model with a set of example prompts and responses, to generate better results. This is often used in _n-shot prompting_, to create responses that mirror your expectations.

If you keep track of ongoing conversations with the model, you can use this practice to restore a session. For example, after a browser restarts, you can help your user continue engaging with the model from where they left off. One approach is to keep track of session history in local storage.

```
// Restore the session from localStorage, or initialize a new session.
// The UUID is hardcoded here, but would come from a
// session picker in your user interface.
const uuid = '7e62c0e0-6518-4658-bc38-e7a43217df87';

function getSessionData(uuid) {
  try {
    const storedSession = localStorage.getItem(uuid);
    return storedSession ? JSON.parse(storedSession) : false;
  } catch {
    return false;
  }
}

let sessionData = getSessionData(uuid);

// Initialize a new session.
if (!sessionData) {
  // Get the current default parameters so they can be restored as they were,
  // even if the default values change in the future.
  const { defaultTopK, defaultTemperature } =
    await LanguageModel.params();
  sessionData = {
    initialPrompts: [],
    topK: defaultTopK,
    temperature: defaultTemperature,
  };
}

// Initialize the session with the (previously stored or new) session data.
const languageModel = await LanguageModel.create(sessionData);

// Keep track of the ongoing conversion and store it in localStorage.
const prompt = 'Tell me a joke';
try {
  const stream = languageModel.promptStreaming(prompt);
  let result = '';
  // You can already work with each `chunk`, but then store
  // the final `result` in history.
  for await (const chunk of stream) {
    // In practice, you'd render the chunk.
    console.log(chunk);
    result = chunk;
  }

  sessionData.initialPrompts.push(
    { role: 'user', content: prompt },
    { role: 'assistant', content: result },
  );

  // To avoid growing localStorage infinitely, make sure to delete
  // no longer used sessions from time to time.
  localStorage.setItem(uuid, JSON.stringify(sessionData));
} catch (err) {
  console.error(err.name, err.message);
}
```

## Permission Policy, iframes, and Web Workers

By default, the Prompt API is only available to top-level windows and to their same-origin iframes. Access to the API can be delegated to cross-origin iframes using the Permission Policy `allow=""` attribute:

```
<!--
  The hosting site at https://main.example.com can grant a cross-origin iframe
  at https://cross-origin.example.com/ access to the Prompt API by
  setting the `allow="language-model"` attribute.
-->
<iframe src="https://cross-origin.example.com/" allow="language-model"></iframe>
```

The Prompt API isn't available in Web Workers for now, due to the complexity of establishing a responsible document for each worker in order to check the permissions policy status.
