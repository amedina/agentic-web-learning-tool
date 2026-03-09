# Session Patterns

## Table of Contents
- [N-shot prompting](#n-shot-prompting)
- [Restore a session from localStorage](#restore-a-session-from-localstorage)
- [Conversation history management](#conversation-history-management)
- [Branching conversations with clone()](#branching-conversations-with-clone)

---

## N-shot prompting

Use `initialPrompts` to prime the model with examples before the real conversation starts. This is called "n-shot prompting" — you show the model n examples of the input/output pattern you want, so it learns the format from context rather than from instructions alone.

```js
const session = await LanguageModel.create({
  initialPrompts: [
    {
      role: 'system',
      content: 'Classify the sentiment of product reviews as POSITIVE, NEGATIVE, or NEUTRAL.',
    },
    // 3-shot examples:
    { role: 'user', content: 'Review: "Absolutely love this! Best purchase ever."' },
    { role: 'assistant', content: 'POSITIVE' },
    { role: 'user', content: 'Review: "It broke after two days. Very disappointed."' },
    { role: 'assistant', content: 'NEGATIVE' },
    { role: 'user', content: 'Review: "It arrived on time and works as described."' },
    { role: 'assistant', content: 'NEUTRAL' },
  ],
});

// Now classify new reviews — the model follows the established pattern
const result = await session.prompt('Review: "Decent quality but overpriced for what you get."');
console.log(result); // "NEGATIVE" or "NEUTRAL"
```

**When to use n-shot prompting:**
- You need consistent output formatting (e.g., always return a single word, always use JSON)
- The task is hard to describe in words but easy to demonstrate
- You want to override the model's default verbosity with concise responses

---

## Restore a session from localStorage

Sessions don't survive page reloads, but you can reconstruct them by storing conversation history and replaying it via `initialPrompts`.

```js
const SESSION_KEY = 'ai-chat-session';

// --- Saving ---
function saveSession(sessionData) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.warn('Could not save session:', e);
  }
}

// --- Loading ---
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// --- Initialize ---
async function initSession() {
  const { defaultTopK, defaultTemperature } = await LanguageModel.params();

  // Load stored session or start fresh
  const stored = loadSession();
  const sessionData = stored ?? {
    topK: defaultTopK,
    temperature: defaultTemperature,
    initialPrompts: [
      { role: 'system', content: 'You are a helpful assistant.' },
    ],
  };

  const session = await LanguageModel.create(sessionData);
  return { session, sessionData };
}

// --- Chat loop ---
async function chat(userMessage) {
  const { session, sessionData } = await initSession();

  const stream = session.promptStreaming(userMessage);
  let fullReply = '';

  for await (const chunk of stream) {
    fullReply = chunk;
    renderChunk(chunk); // Update UI progressively
  }

  // Persist the new turn
  sessionData.initialPrompts.push(
    { role: 'user', content: userMessage },
    { role: 'assistant', content: fullReply },
  );
  saveSession(sessionData);

  session.destroy();
}
```

**Important considerations:**
- `localStorage` has a ~5 MB limit. Long conversations will eventually exceed it — prune old turns or use `IndexedDB` for larger histories.
- Store `topK` and `temperature` alongside the prompts so the session is restored with the same parameters, even if defaults change in future Chrome versions.
- Always wrap `localStorage` access in try/catch — it can throw in private browsing or when storage is full.

---

## Conversation history management

As conversations grow, the session's context window fills up (`session.inputUsage` approaches `session.inputQuota`). When it overflows, the oldest messages are silently dropped, which can cause the model to "forget" important context.

### Strategy 1: Monitor and warn

```js
function checkQuota(session) {
  const ratio = session.inputUsage / session.inputQuota;
  if (ratio > 0.8) {
    showWarning('Conversation is getting long. Older messages may be forgotten.');
  }
}

// Call after each prompt
await session.prompt(userMessage);
checkQuota(session);
```

### Strategy 2: Summarize and restart

When the context window is nearly full, summarize the conversation so far and start a fresh session with the summary as context:

```js
async function summarizeAndRestart(session, sessionData) {
  // Ask the model to summarize the conversation so far
  const summary = await session.prompt(
    'Summarize our conversation so far in 3-5 sentences, capturing the key points.'
  );
  session.destroy();

  // Start fresh with the summary as context
  const { defaultTopK, defaultTemperature } = await LanguageModel.params();
  const newSessionData = {
    topK: sessionData.topK ?? defaultTopK,
    temperature: sessionData.temperature ?? defaultTemperature,
    initialPrompts: [
      { role: 'system', content: sessionData.initialPrompts[0]?.content ?? '' },
      { role: 'user', content: 'Here is a summary of our conversation so far:' },
      { role: 'assistant', content: summary },
    ],
  };

  return {
    session: await LanguageModel.create(newSessionData),
    sessionData: newSessionData,
  };
}
```

### Strategy 3: Sliding window

Keep only the last N turns in `initialPrompts`, discarding older ones:

```js
const MAX_TURNS = 10; // Keep last 10 user+assistant pairs

function trimHistory(initialPrompts) {
  const systemPrompts = initialPrompts.filter(p => p.role === 'system');
  const conversationTurns = initialPrompts.filter(p => p.role !== 'system');

  // Keep only the last MAX_TURNS * 2 messages (each turn = user + assistant)
  const trimmed = conversationTurns.slice(-(MAX_TURNS * 2));
  return [...systemPrompts, ...trimmed];
}
```

---

## Branching conversations with clone()

`session.clone()` creates an independent copy of a session — same history, same parameters, but changes to one don't affect the other. This is useful for:

- **A/B testing prompts**: Try two different follow-up prompts from the same point in a conversation
- **Speculative execution**: Pre-generate a likely response while waiting for user input
- **Undo**: Keep a snapshot before a risky prompt so you can roll back

```js
// User is at a decision point in a story
const session = await LanguageModel.create({
  initialPrompts: [
    { role: 'system', content: 'You are narrating an interactive story.' },
  ],
});

await session.prompt('The hero stands at a crossroads. Two paths lie ahead.');

// Branch: explore both choices without committing
const branchA = await session.clone();
const branchB = await session.clone();

const [resultA, resultB] = await Promise.all([
  branchA.prompt('The hero takes the left path into the dark forest.'),
  branchB.prompt('The hero takes the right path toward the distant village.'),
]);

// Show both options to the user, let them pick
showOptions(resultA, resultB);

// User picks A — continue from branchA, discard branchB
branchB.destroy();
// branchA is now the active session
```
