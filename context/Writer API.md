# Writer API

The Writer API helps you create new content that conforms to a specified writing task. The Writer API and the [Rewriter API](/docs/ai/rewriter) are part of the [Writing Assistance APIs proposal](https://github.com/explainers-by-googlers/writing-assistance-apis/).

These partner APIs can help you improve content created by users.

## Use cases

Write new content, based on your initial idea and optional context. This could be used to:

-   Support users write any kind of content, like reviews, blog posts, or emails.
-   Help users write better support requests.
-   Draft an introduction for a series of work samples, to better capture certain skills.

## Get started

[Join the Writer API origin trial](#origin-trial) running in Chrome 137 to 148.

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

### Sign up for the origin trial

The Writer API is available in a joint origin trial with the Rewriter API. To start using these APIs:

1.  Acknowledge [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).
2.  Go to the [Writer API origin trial](/origintrials#/view_trial/-8779204523605360639).
3.  Click **Register** and fill out the form. In the Web origin field, provide your [origin](https://web.dev/articles/same-site-same-origin#origin) or extension ID, `chrome-extension://YOUR_EXTENSION_ID`.
4.  To submit, click **Register**.
5.  Copy the token provided, and add it to every participating web page on your origin or include it in [your Extension manifest](/docs/web-platform/origin-trials#extensions).
6.  Start using the Writer and Rewriter APIs.

Learn more about how to [get started with origin trials](/docs/web-platform/origin-trials).

### Add support to localhost

To access the Writer API on localhost, use [Chrome flags](/docs/web-platform/chrome-flags):

1.  Set `chrome://flags/#optimization-guide-on-device-model` to **Enabled**.
2.  Set the following flags to **Enabled** or **Enabled Multilingual**:
    -   `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
    -   `chrome://flags/#writer-api-for-gemini-nano`
3.  Click **Relaunch** or restart Chrome.

## Use the Writer API

First, run feature detection to see if the browser supports these APIs.

```
if ('Writer' in self) {
  // The Writer API is supported.
}
```

The Writer API, and all other built-in AI APIs, are integrated in the browser. Gemini Nano is downloaded separately the first time any website uses a built-in AI API. In practice, if a user has already interacted with a built-in API, they have downloaded the model to their browser.

To determine if the model is ready to use, call the asynchronous [`Writer.availability()`](/docs/ai/get-started#model-download) function. If the response to `availability()` is `downloadable`, listen for download progress and inform the user, as the download may take time.

```
const availability = await Writer.availability();
```

To trigger model download and start the writer, check for [user activation](/docs/ai/get-started#user-activation) and call the `Writer.create()` function.

```
const writer = await Writer.create({
  monitor(m) {
    m.addEventListener("downloadprogress", e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});
```

### API functions

The `create()` function lets you configure a new writer object. It takes an optional `options` object with the following parameters:

-   `tone`: [Writing tone](https://owl.purdue.edu/owl/multilingual/multilingual_students/key_concepts_for_writing_in_north_american_colleges/style_genre_and_writing.html) can refer to the style, character, or attitude of the content. The value can be set to `formal`, `neutral` (default), or `casual`.
-   `format`: The output formatting, with the allowed values `markdown` (default) and `plain-text`.
-   `length`: The length of the output, with the allowed values `short` (default), `medium`, and `long`.
-   `sharedContext`: When writing [multiple outputs](#multiple-tasks), a shared context can help the model create content better aligned with your expectations.

The following example demonstrates how to initiate a `writer` object:

```
const options = {
  sharedContext: 'This is an email to acquaintances about an upcoming event.',
  tone: 'casual',
  format: 'plain-text',
  length: 'medium',
};

const available = await Writer.availability();
let writer;
if (available === 'unavailable') {
  // The Writer API isn't usable.
  return;
}
if (available === 'available') {
  // The Writer API can be used immediately .
  writer = await Writer.create(options);
} else {
  // The Writer can be used after the model is downloaded.
  const writer = await Writer.create({
    ...options,
    monitor(m) {
      m.addEventListener("downloadprogress", e => {
        console.log(`Downloaded ${e.loaded * 100}%`);
      });
    }
  });
}
```

### Assign expected languages

The Writer API supports multiple languages. Set the expected input and context languages as well as the expected output language when creating your session. This allows the browser to reject the request if the browser cannot support a specific language combination.

```
const writer = await Writer.create({
  tone: "formal",
  expectedInputLanguages: ["en", "ja", "es"],
  expectedContextLanguages: ["en", "ja", "es"],
  outputLanguage: "es",
  sharedContext: "These are requests to write messages to teachers in a Spanish language program, by students who may speak Spanish, Japanese, or English. Staff expect questions to be written in Spanish."
});
```

### Start writing

There are two ways to output writing from the model: request-based output and streaming.

#### Request-based output

For request-based output (or "non-streaming"), the model waits for the entire input to be generated, process that input as a whole, and then produces the output.

To get a request-based output, call the asynchronous `write()` function. You must include a prompt for the content you want written. You can add an optional `context` to provide the model background information, which may help the model better meet your expectations for the output.

```
// Request-based
const writer = await Writer.create();
const result = await writer.write(
  "An inquiry to my bank about how to enable wire transfers on my account.",
  {
    context: "I'm a longstanding customer",
  },
);
```

#### Stream writing output

Streaming offers continuous results, in real-time. The output updates incrementally, as input is added and adjusted.

To get a streaming writer, call the `writeStreaming()` function and iterate over the available segments of text in the stream. You can add an optional `context` to provide the model background information, which may help the model better meet your expectations for the output.

```
// Streaming
const writer = await Writer.create(
  expectedInputLanguages: ["en"],
  expectedContextLanguages: ["en"],
  outputLanguage: "en",
);
const stream = writer.writeStreaming(
  "An inquiry to my bank about how to enable wire transfers on my account.", {
    context: "I'm a longstanding customer",
  },
);
for await (const chunk of stream) {
  composeTextbox.append(chunk);
}
```

#### Share context for multiple tasks

You may want to use a `writer` to generate multiple pieces of content. In this case, it's useful to add `sharedContext`. For example, you may want to help reviewers give better feedback in comments.

```
// Shared context and per writing task context
const writer = await Writer.create({
    expectedInputLanguages: ["en"],
    expectedContextLanguages: ["en"],
    outputLanguage: "en",
    sharedContext:
      "This is for publishing on [popular website name], a business" +
      "and employment-focused social media platform."
});

const stream = writer.writeStreaming(
  "Write a blog post about how I love all this work on gen AI at Google!" +
  "Mention that there's so much to learn and so many new things I can do!",
  { context: " The request comes from someone working at a startup providing an e-commerce CMS solution."}
);

for await (const chunk of stream) {
  composeTextbox.append(chunk);
}
```

#### Reuse a writer

You can use the same writer to create multiple pieces of content.

```
// Reuse a writer
const writer = await Writer.create({ tone: "formal" });

const reviews = await Promise.all(
  Array.from(
    document.querySelectorAll("#reviews > .review"),
    (reviewEl) => writer.write(reviewEl.textContent)
  ),
);
```

#### Stop the writer

To end the writing process, abort the controller and destroy the writer.

```
// Aborting a writer
const controller = new AbortController();
stopButton.onclick = () => controller.abort();

const writer = await Writer.create({ signal: controller.signal });
await writer.write(reviewEl.textContent, { signal: controller.signal });

// Destroying a writer
writer.destroy();
```

## Permission Policy, iframes, and Web Workers

By default, the Writer API is only available to top-level windows and to their same-origin iframes. Access to the API can be delegated to cross-origin iframes using the Permission Policy `allow=""` attribute:

```
<!--
  The hosting site at https://main.example.com can grant a cross-origin iframe
  at https://cross-origin.example.com/ access to the Writer API by
  setting the `allow="writer"` attribute.
-->
<iframe src="https://cross-origin.example.com/" allow="writer"></iframe>
```

The Writer API isn't available in Web Workers. This is due to the complexity of establishing a responsible document for each worker in order to check the Permissions Policy status.
