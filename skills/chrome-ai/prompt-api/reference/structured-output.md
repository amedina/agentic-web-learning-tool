# Structured Output

## Table of Contents
- [Overview](#overview)
- [Primitive types](#primitive-types)
- [Object schemas](#object-schemas)
- [Array schemas](#array-schemas)
- [Enum / union types](#enum--union-types)
- [Regex patterns](#regex-patterns)
- [Measuring token cost of a schema](#measuring-token-cost-of-a-schema)
- [omitResponseConstraintInput](#omitresponseconstraintinput)
- [Common use cases](#common-use-cases)

---

## Overview

The `responseConstraint` option on `session.prompt()` and `session.promptStreaming()` forces the model to return output that conforms to a JSON Schema or regular expression. The output is always a JSON string — parse it with `JSON.parse()`.

```js
const result = await session.prompt('Your prompt here', {
  responseConstraint: { /* JSON Schema */ },
});
const parsed = JSON.parse(result);
```

This is useful whenever you need machine-readable output: classification labels, extracted entities, ratings, structured data, etc.

---

## Primitive types

### Boolean

```js
const result = await session.prompt(
  'Is this sentence grammatically correct? "She go to school every day."',
  { responseConstraint: { type: 'boolean' } }
);
console.log(JSON.parse(result)); // false
```

### Number

```js
const result = await session.prompt(
  'Rate the sentiment of this review from -1.0 (very negative) to 1.0 (very positive): "Decent but nothing special."',
  { responseConstraint: { type: 'number', minimum: -1, maximum: 1 } }
);
console.log(JSON.parse(result)); // e.g. 0.1
```

### Integer

```js
const result = await session.prompt(
  'On a scale of 1 to 5, how formal is this text? "Hey, wanna grab lunch?"',
  { responseConstraint: { type: 'integer', minimum: 1, maximum: 5 } }
);
console.log(JSON.parse(result)); // 1
```

### String (unconstrained)

```js
const result = await session.prompt(
  'What is the primary language of this text? "Bonjour, comment ça va?"',
  { responseConstraint: { type: 'string' } }
);
console.log(JSON.parse(result)); // "French"
```

---

## Object schemas

Use object schemas to extract multiple fields at once.

### Contact extraction

```js
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string' },
    phone: { type: 'string' },
    company: { type: 'string' },
  },
  required: ['name'],
  additionalProperties: false,
};

const result = await session.prompt(
  'Extract contact info from: "Hi, I\'m Sarah Chen from Acme Corp. Reach me at sarah@acme.com or 555-0123."',
  { responseConstraint: schema }
);
console.log(JSON.parse(result));
// { name: "Sarah Chen", email: "sarah@acme.com", phone: "555-0123", company: "Acme Corp" }
```

### Event extraction from text

```js
const schema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    date: { type: 'string', description: 'ISO 8601 date string' },
    location: { type: 'string' },
    description: { type: 'string' },
  },
  required: ['title', 'date'],
  additionalProperties: false,
};

const result = await session.prompt(
  `Extract the event details: "Join us for the Annual Tech Summit on March 15, 2025 at the Grand Convention Center. 
   A full day of keynotes and workshops on AI and cloud computing."`,
  { responseConstraint: schema }
);
const event = JSON.parse(result);
// { title: "Annual Tech Summit", date: "2025-03-15", location: "Grand Convention Center", description: "..." }
```

### Nested objects

```js
const schema = {
  type: 'object',
  properties: {
    product: { type: 'string' },
    sentiment: {
      type: 'object',
      properties: {
        overall: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
        score: { type: 'number', minimum: 0, maximum: 1 },
      },
      required: ['overall', 'score'],
    },
    topics: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5,
    },
  },
  required: ['product', 'sentiment', 'topics'],
  additionalProperties: false,
};

const result = await session.prompt(
  'Analyze this review: "The camera on this phone is incredible, but battery life is disappointing."',
  { responseConstraint: schema }
);
```

---

## Array schemas

### Extract a list of items

```js
const schema = {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 5,
};

const result = await session.prompt(
  'List the main ingredients in a classic margherita pizza.',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // ["tomato sauce", "mozzarella", "fresh basil", "olive oil", "pizza dough"]
```

### Array of objects

```js
const schema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      term: { type: 'string' },
      definition: { type: 'string' },
    },
    required: ['term', 'definition'],
    additionalProperties: false,
  },
  maxItems: 5,
};

const result = await session.prompt(
  'Define these machine learning terms: overfitting, gradient descent, epoch.',
  { responseConstraint: schema }
);
const glossary = JSON.parse(result);
// [{ term: "overfitting", definition: "..." }, ...]
```

---

## Enum / union types

### Fixed set of labels

```js
const schema = {
  type: 'string',
  enum: ['sports', 'politics', 'technology', 'entertainment', 'health', 'other'],
};

const result = await session.prompt(
  'Categorize this headline: "Scientists discover new exoplanet in habitable zone"',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // "technology"
```

### Multi-label classification

```js
const schema = {
  type: 'array',
  items: {
    type: 'string',
    enum: ['urgent', 'billing', 'technical', 'feedback', 'general'],
  },
  uniqueItems: true,
};

const result = await session.prompt(
  'Classify this support ticket: "My account was charged twice and I can\'t log in!"',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // ["urgent", "billing", "technical"]
```

---

## Regex patterns

Use `pattern` in a string schema to constrain the format of the output.

### Hashtag generation

```js
const schema = {
  type: 'object',
  properties: {
    hashtags: {
      type: 'array',
      maxItems: 3,
      items: {
        type: 'string',
        pattern: '^#[^\\s#]+$', // Must start with # and contain no spaces
      },
    },
  },
  required: ['hashtags'],
  additionalProperties: false,
};

const result = await session.prompt(
  'Generate hashtags for: "Just finished a 10k run at sunrise!"',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // { hashtags: ["#running", "#10k", "#sunrise"] }
```

### ISO date extraction

```js
const schema = {
  type: 'string',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$', // YYYY-MM-DD
};

const result = await session.prompt(
  'Extract the date from: "The meeting is scheduled for the fifteenth of April, 2025."',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // "2025-04-15"
```

### Color hex code

```js
const schema = {
  type: 'string',
  pattern: '^#[0-9A-Fa-f]{6}$',
};

const result = await session.prompt(
  'What hex color best represents "calm ocean blue"?',
  { responseConstraint: schema }
);
console.log(JSON.parse(result)); // "#4A90D9"
```

---

## Measuring token cost of a schema

The JSON Schema is included in the model's input by default, consuming part of the session's token quota. You can measure how much quota a schema will use before committing:

```js
const schema = { /* your schema */ };
const session = await LanguageModel.create();

const cost = await session.measureInputUsage(
  'Your prompt text here',
  { responseConstraint: schema }
);

console.log(`This prompt + schema will use ${cost} tokens`);
console.log(`Remaining quota: ${session.inputQuota - session.inputUsage}`);
```

This is useful when working with large schemas or near the context window limit.

---

## omitResponseConstraintInput

By default, the full JSON Schema is injected into the model's input alongside your prompt. This helps the model understand the expected format but costs tokens.

Set `omitResponseConstraintInput: true` to skip this injection — the schema is still used to constrain the output, but the model won't see it as part of the input. When you do this, include format guidance in your prompt instead:

```js
// Without omitResponseConstraintInput (default): schema is in the input
const result = await session.prompt(
  'Rate this product review.',
  {
    responseConstraint: {
      type: 'object',
      properties: { rating: { type: 'integer', minimum: 1, maximum: 5 } },
      required: ['rating'],
    },
  }
);

// With omitResponseConstraintInput: schema NOT in input, prompt must guide format
const result = await session.prompt(
  'Rate this product review on a scale of 1-5. Output only a JSON object with a single "rating" key whose value is an integer.\nReview: "Excellent build quality, fast shipping, highly recommend."',
  {
    responseConstraint: {
      type: 'object',
      properties: { rating: { type: 'integer', minimum: 1, maximum: 5 } },
      required: ['rating'],
    },
    omitResponseConstraintInput: true,
  }
);
```

**When to use `omitResponseConstraintInput: true`:**
- Your schema is large and you're close to the token quota limit
- You have a very clear prompt that already describes the output format
- You want to reduce latency by keeping the input shorter

---

## Common use cases

### Content moderation

```js
const schema = {
  type: 'object',
  properties: {
    safe: { type: 'boolean' },
    categories: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['spam', 'hate_speech', 'violence', 'adult', 'misinformation'],
      },
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: ['safe', 'categories', 'confidence'],
  additionalProperties: false,
};

async function moderateContent(text) {
  const session = await LanguageModel.create();
  const result = await session.prompt(
    `Analyze this user-generated content for policy violations:\n\n"${text}"`,
    { responseConstraint: schema }
  );
  session.destroy();
  return JSON.parse(result);
}
```

### Form field auto-fill from natural language

```js
const schema = {
  type: 'object',
  properties: {
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    streetAddress: { type: 'string' },
    city: { type: 'string' },
    state: { type: 'string', pattern: '^[A-Z]{2}$' },
    zipCode: { type: 'string', pattern: '^\\d{5}$' },
  },
  required: ['firstName', 'lastName'],
  additionalProperties: false,
};

const result = await session.prompt(
  'Extract address info: "Ship to John Smith at 123 Main Street, Springfield, IL 62701"',
  { responseConstraint: schema }
);
const formData = JSON.parse(result);
// Auto-populate form fields
Object.entries(formData).forEach(([field, value]) => {
  const input = document.getElementById(field);
  if (input) input.value = value;
});
```

### Article summarization with metadata

```js
const schema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' }, maxItems: 5 },
    readingTimeMinutes: { type: 'integer', minimum: 1 },
    difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
    tags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
  },
  required: ['summary', 'keyPoints', 'readingTimeMinutes', 'difficulty', 'tags'],
  additionalProperties: false,
};

const articleText = document.querySelector('article').textContent;
const result = await session.prompt(
  `Analyze this article and provide structured metadata:\n\n${articleText}`,
  { responseConstraint: schema }
);
const metadata = JSON.parse(result);
```
