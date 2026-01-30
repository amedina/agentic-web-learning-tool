# The Proofreader API

Proofreading is the process of looking for and correcting errors in grammar, spelling, and punctuation. Browsers and operating systems have increasingly offered proofreading to their composing tools, such as in [Google Docs](https://support.google.com/docs/answer/57859).

With the Proofreader API, you can provide interactive proofreading to your web application or extension, with built-in AI. This API offers the following functions:

-   **Correction**: Correct user inputs for grammar, spelling, and punctuation.
-   **Labels**: Label each correction by the error type.
-   **Explanation**: Defining what the error is or why the correct was necessary in plain language.

### Use cases

There are many reasons you may want to use Proofreader API For example:

-   Suggest corrections to forum messages, comments on articles, and emails, before the post is submitted.
-   Provide corrections during active note-taking.

## Get started

Join the Proofreader API origin trial, running in Chrome 141 to 145.

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

### Add support to localhost

All of the built-in AI APIs are available on `localhost` in Chrome. Set the following flags to **Enabled**:

-   `chrome://flags/#optimization-guide-on-device-model`
-   `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`
-   `chrome://flags/#proofreader-api-for-gemini-nano`

Then click **Relaunch** or restart Chrome. If you encounter errors, [troubleshoot localhost](/docs/ai/get-started#troubleshoot_localhost).

### Sign up for the origin trial

To start using the Proofreader API, follow these steps:

1.  Acknowledge [Google's Generative AI Prohibited Uses Policy](https://policies.google.com/terms/generative-ai/use-policy).
2.  Go to the [Proofreader API origin trial](https://developer.chrome.com/origintrials/#/registration/2794008579760193537).
3.  Click **Register** and fill out the form. In the Web origin field, provide your [origin](https://web.dev/articles/same-site-same-origin#origin) or extension ID, `chrome-extension://YOUR_EXTENSION_ID`.
4.  To submit, click **Register**.
5.  Copy the token provided, and add it to every participating web page on your origin or include it in your Extension manifest.
    -   If you're building an Extension, follow the [Extensions origin trial instructions](/docs/web-platform/origin-trials#extensions)
6.  Start using the Proofreader API.

Learn more about how to [get started with origin trials](/docs/web-platform/origin-trials).

## Use the Proofreader API

To determine if the model is ready to use, call [Proofreader.availability()](/docs/ai/get-started#model_download). If the response to `availability()` was `"downloadable"`, listen for download progress and inform the user, as the download may take time.

```
const options = {
  expectedInputLanguages: ['en'],
};
const availability = await Proofreader.availability();
```

To trigger the download and instantiate the proofreader, check for [user activation](/docs/ai/get-started#user-activation). Then, call the asynchronous `Proofreader.create()` function.

```
const session = await Proofreader.create({
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  },
  ...options,
});
```

### Create a Proofreader object

To create a Proofreader, use the `Proofreader.create()` function.

```
const proofreader = await Proofreader.create({
  expectedInputLanguages: ["en"],
  monitor(m) {
    m.addEventListener("downloadprogress", e => {
      console.log(`Downloaded ${e.loaded * 100}%`);
    });
  }
});
```

The `create()` method includes the following options:

-   `expectedInputLanguages`: An array of expected input languages.

The `includeCorrectionTypes` and `includeCorrectionExplanation` options from the [explainer](https://github.com/webmachinelearning/proofreader-api?tab=readme-ov-file#detailed-design-discussion) aren't supported.

### Start proofreading user text

Call `proofread()` to get corrections for an input text:

```
const proofreadResult = await proofreader.proofread(
  'I seen him yesterday at the store, and he bought two loafs of bread.',
);
```

Corrections are a type of `ProofreadResult`. Find the fully corrected input in the `correctedInput` attribute and the list of corrections in the `corrections` array:

```
let inputRenderIndex = 0;

console.log(proofreadResult.correction);

for (const correction of proofreadResult.corrections) {
  // Render part of input that has no error.
  if (correction.startIndex > inputRenderIndex) {
    const unchangedInput = document.createElement('span');
    unchangedInput.textContent = input.substring(inputRenderIndex, correction.startIndex);
    editBox.append(unchangedInput);
  }
  // Render part of input that has an error and highlight as such.
  const errorInput = document.createElement('span');
  errorInput.textContent = input.substring(correction.startIndex, correction.endIndex);
  errorInput.classList.add('error');
  editBox.append(errorInput);
  inputRenderIndex = correction.endIndex;
}

// Render the rest of the input that has no error.
if (inputRenderIndex !== input.length){
  const unchangedInput = document.createElement('span');
  unchangedInput.textContent = input.substring(inputRenderIndex, input.length);
  editBox.append(unchangedInput);
}
```

## Permission Policy, iframes, and Web Workers

By default, the Proofreader API is only available to top-level windows and to their same-origin iframes. Access to the API can be delegated to cross-origin iframes using the Permission Policy allow="" attribute:

```
<!--
  The hosting site at https://main.example.com can grant a cross-origin iframe
  at https://cross-origin.example.com/ access to the Proofreader API by
  setting the `allow="proofreader"` attribute.
-->
<iframe src="https://cross-origin.example.com/" allow="proofreader"></iframe>
```

The Proofreader API isn't available in Web Workers. This is due to the complexity of establishing a responsible document for each worker, in order to check the Permissions Policy status.
